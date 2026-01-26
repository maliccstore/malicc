import { Query, Resolver, Arg, Mutation, Authorized, Ctx, FieldResolver, Root } from "type-graphql";
import { Service } from "typedi";
import {
  SignupInput,
  SignupResponse,
  UserProfile,
} from "../schemas/user.schema";

import UserService from "../../../service/user.service";
import { VerificationService } from "../../../service/VerificationService";
import { UserToken } from "../../../types/user";
import { UserRole } from "../../../enums/UserRole";

@Service()
@Resolver(() => UserProfile)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService
  ) { }

  @FieldResolver(() => Boolean)
  isAdmin(@Root() user: any): boolean {
    // Attempt safe access (Sequelize model vs plain object)
    const roleValue = user.role || (user.dataValues && user.dataValues.role);

    if (!roleValue) return false;
    const role = String(roleValue).toLowerCase();
    return role === "admin" || role === "super_admin";
  }

  // Deprecate it in production
  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Query(() => [UserProfile])
  async users(@Ctx() { user }: { user: UserToken }) {
    console.log(user);
    // if (user.email === "shahzer@malicc.store" || user.email === "pranay@malicc.store") {
    try {
      return await this.userService.findAllUsers();
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to fetch users");
    }
    // } else {
    //   throw new Error("Not authenticated");
    // }
  }

  @Authorized()
  @Query(() => UserProfile, { nullable: true })
  async user(@Ctx() { user }: { user: UserToken }) {
    if (!user) throw new Error("Not authenticated");
    try {
      const fetchedUser = await this.userService.getUserByPhone(user.phoneNumber);
      return fetchedUser;
    } catch (error) {
      throw new Error("Failed to fetch user");
    }
  }

  @Mutation(() => SignupResponse)
  async signup(@Arg("input") input: SignupInput): Promise<SignupResponse> {
    let user = await this.userService.createUser({
      ...input,
      phoneNumber: input.phoneNumber,
      isPhoneVerified: false,
      role: UserRole.CUSTOMER,
    });

    if (!user) {
      throw new Error("User creation failed");
    }

    try {
      const { otp, otpExpiration } = await this.userService.generateUserOTP(
        user.phoneNumber
      );
      console.log(`OTP: ${otp} \n OTP Expiration: ${otpExpiration}`);
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
