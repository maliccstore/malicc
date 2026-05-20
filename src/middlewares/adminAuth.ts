import { AuthenticationError, ForbiddenError } from "../errors/";
import { Context } from "../api/graphql/context";
import { UserRole } from "../enums/UserRole";
import { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken } from "../utils/auth";

import User from "../models/UserModel";

export const requireAdmin = (context: Context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }

  if (
    context.user.role !== UserRole.ADMIN &&
    context.user.role !== UserRole.SUPERADMIN
  ) {
    throw new ForbiddenError("Admin access required");
  }
};

export const requireSuperAdmin = (context: Context) => {
  if (!context.user) {
    throw new AuthenticationError("Authentication required");
  }

  if (context.user.role !== UserRole.SUPERADMIN) {
    throw new ForbiddenError("Super admin access required");
  }
};

export const adminRestAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const payload = verifyToken(token);

    // Fetch latest user from DB in case token role is stale or undefined
    const dbUser = await User.findByPk(payload.id);
    if (!dbUser) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const role = String(dbUser.role).toLowerCase();
    if (role !== UserRole.ADMIN && role !== UserRole.SUPERADMIN) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    (req as any).user = dbUser;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};
