import { Query, Resolver, Arg, Mutation } from "type-graphql";
import { Service } from "typedi";
import {
  SignupInput,
  SignupResponse,
  UserProfile,
} from "../schemas/user.schema";

import { hash } from "bcrypt";

import UserService from "../../../service/user.service";
import { VerificationService } from "../../../service/VerificationService";

@Service()
@Resolver()
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService
  ) {}

  @Query(() => [UserProfile])
  async users() {
    try {
      return await this.userService.findAllUsers();
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch users");
    }
  }

  @Query(() => UserProfile, { nullable: true })
  async user(@Arg("id") id: number) {
    return this.userService.findUser(id);
  }

  @Mutation(() => SignupResponse)
  async signup(@Arg("input") input: SignupInput): Promise<SignupResponse> {
    const hashedPassword = await hash(input.password, 10);

    let user = await this.userService.createUser({
      ...input,
      password: hashedPassword,
      isPhoneVerified: false,
    });

    if (!user) {
      throw new Error("User creation failed");
    }

    try {
      const { otp, otpExpiration } = await this.userService.generateUserOTP(
        user.phoneNumber
      );

      this.verificationService.sendVerificationCode(
        user.phoneNumber,
        otp,
        otpExpiration
      );
    } catch (error) {
      console.log("Failed to update: ", error);
    }

    return { user: user };
  }
}
