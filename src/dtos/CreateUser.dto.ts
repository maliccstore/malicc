import { UserType } from "../types/user";

export type CreateUserDTO = Omit<UserType, "id" | "createdAt" | "updatedAt">;

export type NewUserType = Omit<
  UserType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "otp"
  | "otpExpiration"
  | "username"
  | "email"
>;
