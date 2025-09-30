import { Request, Response, NextFunction } from "express";
import Container from "typedi";
import { SessionService } from "../service/session.service";

export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionService = Container.get(SessionService);

  let sessionId = req.cookies?.sessionId;

  // If no session cookie, check if we should create one
  if (!sessionId) {
    console.log("🆕 No session cookie found, will create one when needed");
    // We'll create the session in the context, but we set a flag
    (req as any).needsNewSession = true;
  } else {
    // Verify the session exists and is valid
    const session = await sessionService.findSession(sessionId);
    if (!session) {
      console.log("❌ Session cookie exists but session not found in DB");
      // Clear the invalid cookie
      res.clearCookie("sessionId");
      (req as any).needsNewSession = true;
    } else {
      console.log("✅ Valid session found:", session.sessionId);
      (req as any).session = session;
    }
  }

  next();
};
