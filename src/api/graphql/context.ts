import User from "../../models/UserModel";
import { UserRole } from "@/enums/UserRole";
import { Request, Response } from "express";
import Container from "typedi";
import { SessionService } from "../../service/session.service";
import { CartService } from "../../service/cart.service";
import { SessionData } from "../../interface/session";
import { CartData } from "../../interface/cart";

export interface Context {
  req: Request;
  token?: string;
  user?: {
    id: number;
    phoneNumber: string;
    role: UserRole;
    isPhoneVerified: boolean;
  };
}

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: any;
  session?: SessionData;
  cart?: CartData;
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

  let session: SessionData | undefined;
  let cart: CartData | undefined;
  let user = req.user; // Your existing user from JWT

  // Try to get session ID from various sources
  let sessionId = req.cookies?.sessionId;

  if (!sessionId && req.headers.authorization?.startsWith("Session ")) {
    sessionId = req.headers.authorization.substring(8);
  }

  // Find or create session
  if (sessionId) {
    session = await sessionService.findSession(sessionId);
  }

  if (!session) {
    session = await sessionService.createSession({
      userId: user?.id,
      userRole: user?.role || "guest",
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    // Set cookie for web clients
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      res.cookie("sessionId", session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    sessionId = session.sessionId;
  }

  // Get or create cart for this session
  if (sessionId) {
    cart = await cartService.getOrCreateCart(sessionId, user?.id);
  }

  // If user is logged in but session is not associated, convert it
  if (user && session && !session.userId) {
    session = await sessionService.convertToUserSession(
      session.sessionId,
      user.id,
      user.role
    );

    // Merge guest cart with user cart
    if (cart) {
      cart = await cartService.mergeCarts(session.sessionId, user.id);
    }
  }

  return {
    req,
    res,
    user,
    session,
    cart,
    sessionService,
    cartService,
  };
};
