import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { AuthChecker } from "type-graphql";
import { GraphQLContext } from "../api/graphql/context";
import { AuthPayload } from "../api/graphql/schemas/user.schema";
import { Request } from "express";

export function generateJWT(user: User) {
  return jwt.sign(
    { id: user.id, phoneNumber: user.phoneNumber, email: user.email },
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
  return jwt.verify(token, process.env.JWT_SECRET) as AuthPayload;
}
export const authChecker: AuthChecker<GraphQLContext> = (
  { context },
  roles: string[]
) => {
  if (!context.user) {
    throw new Error("Not authenticated");
  }

  // Role-based authorization
  if (roles.length > 0) {
    // Example: Check if user has required roles
    // const userRoles = context.user.roles || [];
    // return roles.some(role => userRoles.includes(role));

    // For now, just return false if roles are required but not implemented
    return false;
  }

  return true;
};
