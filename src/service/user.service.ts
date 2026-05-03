import "reflect-metadata";
// src/index.ts
import { Service } from "typedi";
import User from "../models/UserModel";
import { CreateUserDTO, NewUserType } from "../dtos/CreateUser.dto";
import { generateOTP, generateOTPExpiration, checkValidOTP } from "../utils/otp";
import { UserType } from "../types/user";

//  These are the use services for the user,
//  Either to Create, Find, Update or Delete a User

@Service()
class UserService {
  async createUser(userData: NewUserType) {
    const user = await User.create(userData as UserType);
    return user;
  }

  async findUser(id: number): Promise<User | null> {
    return User.findByPk(id);
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
  async updateUserByPhone(phoneNumber: string, updatedData: Partial<User>) {
    const [updatedRows] = await User.update(updatedData, {
      where: { phoneNumber },
    });

    if (updatedRows === 0) {
      throw new Error(`No user found with phone number ${phoneNumber}`);
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
      },
    );

    if (updatedRows === 0) {
      throw new Error(`No user found with phone number ${phoneNumber}`);
    }

    return { otp, otpExpiration };
  }

  /**
   * Step 1 of the admin phone-change flow.
   *
   * Immediately writes the new phone number to the user record and marks
   * the phone as unverified, then generates and stores an OTP.
   * The caller is responsible for sending the OTP to `newPhoneNumber`.
   *
   * Returns the OTP details so the caller can dispatch the SMS.
   */
  async initiatePhoneChange(
    currentPhoneNumber: string,
    newPhoneNumber: string,
  ): Promise<{ otp: string; otpExpiration: Date }> {
    const user = await this.getUserByPhone(currentPhoneNumber);
    if (!user) {
      throw new Error("User not found");
    }

    // Ensure the new number isn't already taken
    const conflict = await User.findOne({ where: { phoneNumber: newPhoneNumber } });
    if (conflict) {
      throw new Error("Phone number is already in use by another account");
    }

    const otp = generateOTP();
    const otpExpiration = generateOTPExpiration();

    // Immediately write the new phone number and mark as unverified
    await User.update(
      {
        phoneNumber: newPhoneNumber,
        isPhoneVerified: false,
        otp,
        otpExpiration,
      },
      { where: { phoneNumber: currentPhoneNumber } },
    );

    return { otp, otpExpiration };
  }

  /**
   * Step 2 of the admin phone-change flow.
   *
   * Validates the OTP on the user record (now identified by `newPhoneNumber`
   * since it was already written in step 1), marks the phone as verified,
   * and clears the OTP state.
   */
  async confirmPhoneChange(newPhoneNumber: string, otp: string): Promise<User> {
    // The record now lives under the new phone number (written in step 1)
    const user = await this.getUserByPhone(newPhoneNumber);

    if (!checkValidOTP(user, otp)) {
      throw new Error("Invalid OTP");
    }

    await User.update(
      {
        isPhoneVerified: true,
        otp: null,
        otpExpiration: null,
      },
      { where: { phoneNumber: newPhoneNumber } },
    );

    const updated = await this.getUserByPhone(newPhoneNumber);
    if (!updated) throw new Error("Failed to retrieve updated user");
    return updated;
  }
}

export default UserService;
