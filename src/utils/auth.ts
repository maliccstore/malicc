import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { AuthChecker } from "type-graphql";
import { GraphQLContext, ContextUser } from "../api/graphql/context";
import { Request } from "express";
import { UserRole } from "@/enums/UserRole";
import { ForbiddenError } from "../errors";
import { log } from "node:console";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [hashedPassword, salt] = hash.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export function generateJWT(user: User) {
  return jwt.sign(
    {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
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
export function verifyToken(token: string): ContextUser {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured");
  const payload = jwt.verify(token, process.env.JWT_SECRET!);
  log(payload);
  return payload as ContextUser;
}

export const authChecker: AuthChecker<GraphQLContext, UserRole> = async (
  { context },
  roles, // Typescript will now enforce that these are valid UserRole values
) => {
  // 1. Check Authentication (is there a user?)
  if (!context.user) {
    // It's common to throw a specific error here, like AuthenticationError
    throw new Error("Not authenticated");
  }

  // Fetch the latest user from the DB to avoid stale/undefined roles (similar to adminRestAuth middleware)
  const dbUser = await User.findByPk(context.user.id);
  if (!dbUser) {
    throw new Error("User not found");
  }

  const userRole = String(dbUser.role).toLowerCase();

  // 2. Check Authorization (does the user have the right role?)
  if (roles.length > 0) {
    // Check if the user's role (from DB) is included in the required roles list
    const normalizedRoles = roles.map((r) => String(r).toLowerCase());
    if (!normalizedRoles.includes(userRole)) {
      // User is authenticated but doesn't have the required role
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
  }

  // Update the context user role to match the latest from DB
  context.user.role = dbUser.role;

  // 3. If we get here, the user is authenticated and authorized!
  return true;
};
