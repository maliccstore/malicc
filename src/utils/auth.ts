import { UserProfile } from "./../api/graphql/schemas/user.schema";
import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { AuthChecker } from "type-graphql";
import { GraphQLContext } from "../api/graphql/context";
import { AuthPayload } from "../api/graphql/schemas/user.schema";
import { Request } from "express";
import { UserRole } from "@/enums/UserRole";
import { ForbiddenError } from "../errors";

export function generateJWT(user: User) {
  return jwt.sign(
    {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

// Sign Up OTP Verification
export function verifyToken(token: string): AuthPayload {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured");
  const payload = jwt.verify(token, process.env.JWT_SECRET!);
  return {
    id: (payload as AuthPayload).user.id,
    role: (payload as any).role,
    // other user properties
  };
}

export const authChecker: AuthChecker<GraphQLContext, UserRole> = (
  { context },
  roles // Typescript will now enforce that these are valid UserRole values
) => {
  // 1. Check Authentication (is there a user?)
  if (!context.user) {
    // It's common to throw a specific error here, like AuthenticationError
    throw new Error("Not authenticated");
  }

  // 2. Check Authorization (does the user have the right role?)
  if (roles.length > 0) {
    // Check if the user's role (from context) is included in the required roles list
    // Assuming context.user.role is a single string like "admin" or "customer"
    if (!roles.includes(context.user.role as UserRole)) {
      // User is authenticated but doesn't have the required role
      // throw new ForbiddenError("Not authorized");
      throw new ForbiddenError(
        "You do not have permission to perform this action."
      );
    }
  }

  // 3. If we get here, the user is authenticated and authorized!
  return true;
};
