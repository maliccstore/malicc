import { Service } from "typedi";
import User from "@/models/User";
import { Op } from "sequelize";

@Service()
export class OTPService {
  private generateOTP(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    const otp = this.generateOTP();
    const expiration = new Date(Date.now() + 5 * 60 * 1000); // For 5 Min
    try {
      const [user] = await User.upsert({
        phoneNumber,
        otp,
        otpExpiration: expiration,
        isPhoneVerified: false,
      });

      console.log(`From OTP.service.ts \n OTP for ${phoneNumber}: ${otp}`);
      return true;
    } catch (error) {
      console.log(
        `From OTP.service.ts \n Error sending OTP for ${phoneNumber}. \n Error: ${error}`
      );
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<User> {
    const user = await User.findOne({
      where: {
        phoneNumber,
        otp,
        otpExpiration: { [Op.gt]: new Date() },
      },
    });
    if (!user) {
      throw new Error("Invalid or expired OTP");
    }

    await user.update({
      isPhoneVerified: true,
      otp: null,
      otpExpiration: null,
    });

    return user;
  }
}
