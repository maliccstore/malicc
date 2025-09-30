import { User } from "../models/UserModel"; // Adjust path as needed
import { SessionData } from "../interface/session";

declare global {
  namespace Express {
    interface Request {
      user?: any; // You can use a more specific type if you have User interface
      session?: SessionData;
    }
  }
}

export {};
