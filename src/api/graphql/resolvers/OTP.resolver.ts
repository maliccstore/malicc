import { Resolver, Mutation, Arg } from "type-graphql";
import { VerificationService } from "./../../../service/VerificationService";
import { AuthPayload } from "../schemas/user.schema";
import { Service } from "typedi";
import { generateJWT } from "../../../utils/auth";
import UserService from "../../../service/user.service";

@Service()
@Resolver()
export class OTPResolver {
  constructor(
    private readonly otpService: VerificationService,
    private readonly userService: UserService
  ) {}

  @Mutation(() => Boolean)
  async RequestOTP(@Arg("phoneNumber") phoneNumber: string): Promise<boolean> {
    const { otp, otpExpiration } = await this.userService.generateUserOTP(
      phoneNumber
    );

    this.otpService.sendVerificationCode(phoneNumber, otp, otpExpiration);
    return true;
  }

  @Mutation(() => AuthPayload)
  async verifyOTP(
    @Arg("phoneNumber") phoneNumber: string,
    @Arg("otp") otp: string
  ): Promise<AuthPayload> {
    const user = await this.userService.getUserByPhone(phoneNumber);
    /// Problem at await
    //const user = await this.otpService.verifyCode(phoneNumber, otp);

    if (
      !user ||
      user.otp !== otp ||
      user.otpExpiration == null || // handles both null and undefined
      user.otpExpiration < new Date()
    ) {
      throw new Error("Invalid OTP");
    }

    await this.userService.updateUser(user.email, {
      isPhoneVerified: true,
      otp: null,
      otpExpiration: null,
    });
    const token = generateJWT(user);

    return {
      token,
      user,
    };
  }
}
