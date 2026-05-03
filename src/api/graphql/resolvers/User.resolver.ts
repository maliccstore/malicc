import {
  Query,
  Resolver,
  Arg,
  Mutation,
  Authorized,
  Ctx,
  FieldResolver,
  Root,
} from "type-graphql";
import { Service } from "typedi";
import {
  SignupInput,
  SignupResponse,
  UpdateUserInput,
  UserProfile,
} from "../schemas/user.schema";

import UserService from "../../../service/user.service";
import { VerificationService } from "../../../service/VerificationService";
import { UserToken } from "../../../types/user";
import { UserRole } from "../../../enums/UserRole";
import { GraphQLError } from "graphql";

/** Validates an e-mail string. Returns an error message or null. */
function validateEmail(email: string): string | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : "Invalid email format";
}

/** Validates a phone number (E.164 style). Returns an error message or null. */
function validatePhoneNumber(phone: string): string | null {
  const re = /^\+?[0-9]{10,15}$/;
  return re.test(phone) ? null : "Invalid phone number format (E.164 expected)";
}

@Service()
@Resolver(() => UserProfile)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

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
      const fetchedUser = await this.userService.getUserByPhone(
        user.phoneNumber,
      );
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
        user.phoneNumber,
      );
      console.log(`OTP: ${otp} \n OTP Expiration: ${otpExpiration}`);
      this.verificationService.sendVerificationCode(
        user.phoneNumber,
        otp,
        otpExpiration,
      );
    } catch (error) {
      console.log("Failed to update: ", error);
    }

    return { user: user };
  }

  /**
   * Mutation to update username and/or email for the currently authenticated user.
   */
  @Authorized()
  @Mutation(() => UserProfile)
  async updateUserByPhone(
    @Arg("input") input: UpdateUserInput,
    @Ctx() { user }: { user: UserToken },
  ): Promise<UserProfile> {
    if (!user?.phoneNumber) {
      throw new Error("Not authenticated");
    }

    // --- Input validation ---
    const validationErrors: { field: string; message: string }[] = [];

    if (input.email !== undefined) {
      const err = validateEmail(input.email);
      if (err) validationErrors.push({ field: "email", message: err });
    }

    if (validationErrors.length > 0) {
      throw new GraphQLError("Validation failed", {
        extensions: {
          code: "VALIDATION_ERROR",
          validationErrors,
        },
      });
    }

    await this.userService.updateUserByPhone(user.phoneNumber, {
      username: input.username,
      email: input.email,
    });

    const updated = await this.userService.getUserByPhone(user.phoneNumber);
    if (!updated) throw new Error("Failed to retrieve updated user");
    return updated;
  }

  /**
   * Admin-only mutation to update username and/or email.
   *
   * Phone number changes go through the two-step OTP flow:
   *   requestAdminPhoneChangeOTP → verifyAdminPhoneChange (OTPResolver)
   */
  @Authorized(UserRole.ADMIN)
  @Mutation(() => UserProfile)
  async updateAdminCredentials(
    @Arg("input") input: UpdateUserInput,
    @Ctx() { user }: { user: UserToken },
  ): Promise<UserProfile> {
    if (!user?.phoneNumber) {
      throw new Error("Not authenticated");
    }

    // --- Input validation ---
    const validationErrors: { field: string; message: string }[] = [];

    if (input.email !== undefined) {
      const err = validateEmail(input.email);
      if (err) validationErrors.push({ field: "email", message: err });
    }

    if (validationErrors.length > 0) {
      throw new GraphQLError("Validation failed", {
        extensions: {
          code: "VALIDATION_ERROR",
          validationErrors,
        },
      });
    }

    await this.userService.updateUserByPhone(user.phoneNumber, {
      username: input.username,
      email: input.email,
    });

    const updated = await this.userService.getUserByPhone(user.phoneNumber);
    if (!updated) throw new Error("Failed to retrieve updated user");
    return updated;
  }

  /**
   * Admin-only — Step 1 of the phone-number change flow.
   *
   * Immediately updates phoneNumber → newPhoneNumber, sets isPhoneVerified = false,
   * generates and stores an OTP, then sends it to the new number via SMS.
   *
   * The admin must then call verifyAdminPhoneChange(otp, newPhoneNumber) to confirm.
   */
  @Authorized(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async requestAdminPhoneChangeOTP(
    @Arg("newPhoneNumber") newPhoneNumber: string,
    @Ctx() { user }: { user: UserToken },
  ): Promise<boolean> {
    if (!user?.phoneNumber) {
      throw new Error("Not authenticated");
    }

    const err = validatePhoneNumber(newPhoneNumber);
    if (err) {
      throw new GraphQLError("Validation failed", {
        extensions: {
          code: "VALIDATION_ERROR",
          validationErrors: [{ field: "newPhoneNumber", message: err }],
        },
      });
    }

    const { otp, otpExpiration } = await this.userService.initiatePhoneChange(
      user.phoneNumber,
      newPhoneNumber,
    );

    // OTP is sent to the new number — proves ownership before isPhoneVerified=true
    this.verificationService.sendVerificationCode(newPhoneNumber, otp, otpExpiration);

    return true;
  }
}
