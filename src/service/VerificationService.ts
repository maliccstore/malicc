import User from "../models/User";
import TwilioService from "./TwilioService";
import { Service } from "typedi";
import { UserProfile } from "../api/graphql/schemas/user.schema";

@Service()
export class VerificationService {
  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();
  private CODE_EXPIRATION_MINUTES = 15;

  constructor() {}
  async sendVerificationCode(
    phoneNumber: string,
    otp: string,
    otpExpiration: Date
  ): Promise<boolean> {
    try {
      // Six digit verification code
      const verificationCode = otp;

      // Store the code with expiration

      const expiresAt = otpExpiration;

      expiresAt.setMinutes(
        expiresAt.getMinutes() + this.CODE_EXPIRATION_MINUTES
      );

      this.verificationCodes.set(phoneNumber, {
        code: verificationCode,
        expiresAt,
      });

      console.log(verificationCode);
      // Send the code via SMS

      //await TwilioService.sendVerificationSms(phoneNumber, verificationCode);

      // return verificationCode;
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<UserProfile> {
    const record = this.verificationCodes.get(phoneNumber);

    if (!record) {
      throw new Error("User not found in the data base");
    }

    // check if code isn't expired
    const isValid = record.code === code && new Date() < record.expiresAt;

    // Delete the code either ways

    if (!isValid) {
      throw new Error("User OTP is not Valid");
    }
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      // handle user not found
      throw new Error("User not found");
    }
    const userType: UserProfile = {
      id: user.id,
      username: user.username,
      password: user.password,
      phoneNumber: String(user.phoneNumber), // Your schema uses string, model uses number
      isPhoneVerified: user.isPhoneVerified, // Map differently named field
      otp: user.otp || "", // Handle null fallback
      otpExpiration: user.otpExpiration, // Convert Date to string
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    this.verificationCodes.delete(phoneNumber);

    return userType;
  }
}
