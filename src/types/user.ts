import { CreateUserDTO } from "../dtos/CreateUser.dto";

export type UserType = {
  id: number;
  username: string;
  phoneNumber: string;
  email: string;
  otp?: string | null;
  otpExpiration?: Date | null;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserToken = {
  id: number;
  phoneNumber: string;
  email: string;
  iat: Date;
  exp: Date;
};
export type UserServiceType = {
  createUser: (userData: CreateUserDTO) => {};
  getUserByPhone: (phoneNumber: string) => {};
  findUser: (id: number) => {};
  findAllUsers: () => Promise<UserType[]>;
  updateUser: () => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
};
