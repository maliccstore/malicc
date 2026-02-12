import { Resolver, Mutation, Arg } from "type-graphql";
import { VerificationService } from "./../../../service/VerificationService";
import { AuthPayload, UserProfile } from "../schemas/user.schema";
import { Service } from "typedi";
import { generateJWT } from "../../../utils/auth";
import UserService from "../../../service/user.service";
import { checkValidOTP } from "../../../utils/otp";

@Service()
@Resolver()
export class OTPResolver {
  constructor(
    private readonly otpService: VerificationService,
    private readonly userService: UserService,
  ) {}

  @Mutation(() => Boolean)
  async RequestOTP(@Arg("phoneNumber") phoneNumber: string): Promise<boolean> {
    const { otp, otpExpiration } =
      await this.userService.generateUserOTP(phoneNumber);

    this.otpService.sendVerificationCode(phoneNumber, otp, otpExpiration);
    return true;
  }

  @Mutation(() => AuthPayload)
  async verifyOTP(
    @Arg("phoneNumber") phoneNumber: string,
    @Arg("otp") otp: string,
  ): Promise<AuthPayload> {
    const user = await this.userService.getUserByPhone(phoneNumber);

    const isUserValid = checkValidOTP(user, otp);

    const updateData: Partial<UserProfile> = {
      otp: null,
      otpExpiration: null,
      isPhoneVerified: true,
    };

    if (!isUserValid) {
      throw new Error("Invalid OTP");
    }
    if (user) {
      await this.userService.updateUserByPhone(user.phoneNumber, updateData);

      const token = generateJWT(user);

      return {
        token,
        user,
      };
    } else {
      console.log("user not found");

      throw new Error("User Not found");
    }
  }
  @Mutation(() => Boolean)
  async requestLoginOTP(
    @Arg("phoneNumber") phoneNumber: string,
  ): Promise<boolean> {
    const user = await this.userService.getUserByPhone(phoneNumber);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.isPhoneVerified) {
      throw new Error("User must verify their phone first");
    }

    const { otp, otpExpiration } =
      await this.userService.generateUserOTP(phoneNumber);
    this.otpService.sendVerificationCode(phoneNumber, otp, otpExpiration);
    return true;
  }
}
