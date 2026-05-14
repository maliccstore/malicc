import { NextFunction, Request, Response } from "express";
import { usageService } from "../service/usage.service";

/**
 * requestSniffer middleware
 *
 * Primary purpose: estimate outbound bandwidth by reading the Content-Length
 * header on each response finish event. Accumulated bytes are passed to
 * UsageService for daily snapshot tracking.
 *
 * Secondary purpose: debug logging in development mode.
 */
export default function requestSniffer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Debug logging — development only to avoid noisy production logs
  if (process.env.NODE_ENV === "development") {
    console.log(`[Sniffer] ${req.method} ${req.url} — IP: ${req.ip}`);
  }

  // Bandwidth estimation: fires after the response is fully sent
  res.on("finish", () => {
    const contentLength = res.getHeader("content-length");
    if (contentLength) {
      const bytes = BigInt(String(contentLength));
      if (bytes > 0n) {
        usageService.addBandwidthBytes(bytes);
      }
    }
  });

  next();
}

