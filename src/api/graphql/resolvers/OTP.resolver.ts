import { Resolver, Mutation, Arg } from "type-graphql";
import { VerificationService } from "./../../../service/VerificationService";
import { VerifyOTPInput, AuthPayload } from "../schemas/user.schema";
import { Service } from "typedi";

@Service()
@Resolver()
export class OTPResolver {
  constructor(private readonly otpService: VerificationService) {}

  @Mutation(() => Boolean)
  async RequestOTP(@Arg("phoneNumber") phoneNumber: string): Promise<boolean> {
    return this.otpService.generateAndSendVerificationCode(phoneNumber);
  }

  @Mutation(() => AuthPayload)
  async verifyOTP(@Arg("input") input: VerifyOTPInput): Promise<AuthPayload> {
    /// Problem at await
    const user = await this.otpService.verifyCode(input.phoneNumber, input.otp);
    const token = "generated-jwt-token";

    return {
      token,
      user,
    };
  }
}
