import { Request, Response, NextFunction } from "express";
import Container from "typedi";
import { SessionService } from "../service/session.service";

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      session?: any; // We'll type this properly in context
    }
  }
}

export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionService = Container.get(SessionService);

  // Try to get session ID from cookie
  let sessionId = req.cookies?.sessionId;

  // If no session cookie, check Authorization header for guest sessions
  if (!sessionId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Session ")) {
      sessionId = authHeader.substring(8);
    }
  }

  let session = null;

  if (sessionId) {
    // Find existing session
    session = await sessionService.findSession(sessionId);
  }

  if (!session) {
    // Create new guest session
    session = await sessionService.createSession({
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Set session cookie for web clients
    if (req.headers["sec-fetch-mode"] !== "cors") {
      res.cookie("sessionId", session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
  }

  // Attach session to request
  req.session = session;

  next();
};
