import { Request } from "express";
import User from "../../models/UserModel";

export interface Context {
  req: Request;
  token?: string;
}

export type GraphQLContext = {
  user?: User;
  // Add other context properties if needed
};
