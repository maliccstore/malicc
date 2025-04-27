import jwt from "jsonwebtoken";
import User from "../models/User";

export function generateJWT(user: User) {
  return jwt.sign(
    { id: user.id, phoneNumber: user.phoneNumber },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
}
