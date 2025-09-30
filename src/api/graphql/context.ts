import User from "../../models/UserModel";
import { UserRole } from "@/enums/UserRole";
import { Request, Response } from "express";
import Container from "typedi";
import { SessionService } from "../../service/session.service";
import { CartService } from "../../service/cart.service";
import { SessionData } from "../../interface/session";
import { CartData } from "../../interface/cart";

// Define a proper user type if you have one, otherwise use this:
interface ContextUser {
  id: number;
  role: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  // Add other user properties as needed
}
export interface Context {
  req: Request;
  token?: string;
  user?: ContextUser | null;
}

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: ContextUser | null;
  session?: SessionData | undefined;
  // REMOVE cart from context since it becomes stale
  sessionService: SessionService;
  cartService: CartService;
}

export const createContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> => {
  const sessionService = Container.get(SessionService);
  const cartService = Container.get(CartService);

  let session: SessionData | undefined = (req as any).session;
  const user = (req as any).user as ContextUser | undefined;
  const needsNewSession = (req as any).needsNewSession;

  console.log("🔍 Context creation started");

  let sessionId = req.cookies?.sessionId;

  try {
    // Session creation logic remains the same...
    if (!session && needsNewSession) {
      console.log("🆕 Creating new session...");
      const newSession = await sessionService.createSession({
        userId: user?.id,
        userRole: user?.role || "guest",
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });

      session = newSession;
      sessionId = session.sessionId;

      res.cookie("sessionId", session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Session conversion logic remains...
    if (user && session && !session.userId) {
      console.log("🔄 Converting guest session to user session");
      const convertedSession = await sessionService.convertToUserSession(
        session.sessionId,
        user.id,
        user.role
      );
      session = convertedSession || session;
    }

    console.log("🎉 Final context:", {
      sessionId: session?.sessionId,
      userRole: session?.userRole,
      userId: user?.id,
    });
  } catch (error) {
    console.error("❌ Critical error in context creation:", error);
  }

  return {
    req,
    res,
    user: user || null,
    session,
    sessionService,
    cartService, // Keep cartService for resolvers to use
  };
};
