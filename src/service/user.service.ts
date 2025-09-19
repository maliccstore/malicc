import "reflect-metadata";
// src/index.ts
import { Service } from "typedi";
import User from "../models/UserModel";
import { CreateUserDTO, NewUserType } from "../dtos/CreateUser.dto";
import { generateOTP, generateOTPExpiration } from "../utils/otp";
import { UserType } from "../types/user";

//  These are the use services for the user,
//  Either to Create, Find, Update or Delete a User

@Service()
class UserService {
  async createUser(userData: NewUserType) {
    try {
      const user = await User.create(userData as UserType);

      return user;
    } catch (error) {
      throw new Error(`Username or email already exists ${error}`);
    }
  }

  async findUser(id: number) {
    try {
      return await User.findByPk(id);
    } catch {
      return null;
    }
  }
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await User.findOne({ where: { email } });
      return user;
    } catch {
      return null;
    }
  }
  // CreateUserDTO: Make a new DTO for the User
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      return User.findOne({ where: { phoneNumber } });
    } catch (error) {
      throw new Error(`Error fetching user by phone: ${error}`);
    }
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

    const user = await this.getUserByPhone(phoneNumber);
    if (!user) {
      throw new Error("User not found");
    }
    // Modify this function to use in build private method to update via phoneNumber
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
      throw new Error(`No user found with phone number ${phoneNumber}`);
    }
    return { otp, otpExpiration };
  }
}

export default UserService;
