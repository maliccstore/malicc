import "reflect-metadata";
// src/index.ts
import { Service } from "typedi";
import User from "../models/User";
import { UserType } from "../api/graphql/schemas/user.schema";
import { CreateUserDTO } from "../dtos/CreateUser.dto";
import { generateOTP, generateOTPExpiration } from "../utils/otp";

//  These are the use services for the user,
//  Either to Create, Find, Update or Delete a User

@Service()
class UserService {
  async createUser(userData: CreateUserDTO) {
    try {
      const user = await User.create(userData);
      console.log(`Log at "user.service.ts" \n User created:`, user.toJSON());
      return user;
    } catch (error) {
      throw new Error("Username or email already exists");
    }
  }

  async findUser(id: number) {
    try {
      return await User.findByPk(id);
    } catch {
      return null;
    }
  }

  // CreateUserDTO: Make a new DTO for the User
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return User.findOne({ where: { phoneNumber } });
  }
  async findAllUsers(): Promise<User[]> {
    const users = await User.findAll();
    return users;
  }
  async updateUser(emailToFind: string, updatedData: Partial<User>) {
    const [updatedRows] = await User.update(updatedData, {
      where: { email: emailToFind },
    });
    if (updatedRows === 0) {
      throw new Error(`No user found with email ${emailToFind}`);
    }
    return updatedRows;
  }

  async deleteUser(emailToDelete: string) {
    const deletedRows = await User.destroy({
      where: { email: emailToDelete },
    });
    return deletedRows;
  }

  async generateUserOTP(phoneNumber: string) {
    const otp = generateOTP();
    const otpExpiration = generateOTPExpiration();
    console.warn(`OTP from user.service.ts ${otp}`);
    const [updatedRows] = await User.update(
      {
        otp,
        otpExpiration: otpExpiration,
      },
      {
        where: { phoneNumber: phoneNumber },
      }
    );

    if (updatedRows === 0) {
      throw new Error(`No user found with email ${phoneNumber}`);
    }
    return { otp, otpExpiration };
  }
}

export default UserService;
