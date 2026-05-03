import { UserRole } from "../enums/UserRole";
import { UserType } from "../types/user";

export type CreateUserDTO = Omit<UserType, "id" | "createdAt" | "updatedAt">;

export type CreateUserWithPasswordDTO = CreateUserDTO & {
  password: string;
  isPhoneVerified?: boolean;
  phoneNumber: string; // Explicitly include required fields
  role: UserRole;
};
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
