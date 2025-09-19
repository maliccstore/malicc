import { Request } from "express";
import User from "../../models/UserModel";
import { UserRole } from "@/enums/UserRole";

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

export type GraphQLContext = {
  user?: User;
  // Add other context properties if needed
};
