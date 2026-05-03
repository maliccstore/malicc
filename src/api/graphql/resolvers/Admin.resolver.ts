import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";

import User from "../../../models/UserModel";
import { UserProfile } from "../schemas/user.schema";
import {
  requireAdmin,
  requireSuperAdmin,
} from "../../../middlewares/adminAuth";
import { Context } from "../context";
import { UserRole } from "../../../enums/UserRole";
import ReviewService from "@/service/review.service";

@Resolver()
export class AdminResolver {
  @Authorized()
  @Query(() => [UserProfile])
  async getAllUsers(@Ctx() context: Context): Promise<UserProfile[]> {
    requireAdmin(context);

    const users = await User.findAll();
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  @Authorized()
  @Mutation(() => UserProfile)
  async updateUserRole(
    @Arg("userId") userId: number,
    @Arg("role", () => UserRole) role: UserRole,
    @Ctx() context: Context
  ): Promise<UserProfile> {
    requireSuperAdmin(context); // Only super admin can change roles

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.role = role;
    await user.save();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /* Review Management */
  constructor(private readonly reviewService: ReviewService) { }

  @Authorized()
  @Mutation(() => Boolean)
  async approveReview(
    @Arg("reviewId") reviewId: string,
    @Ctx() context: Context
  ) {
    requireAdmin(context);

    await this.reviewService.adminApproveReview(reviewId);

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async rejectReview(
    @Arg("reviewId") reviewId: string,
    @Ctx() context: Context
  ) {
    requireAdmin(context);

    await this.reviewService.adminRejectReview(reviewId);

    return true;
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteReview(
    @Arg("reviewId") reviewId: string,
    @Ctx() context: Context
  ) {
    requireAdmin(context);

    await this.reviewService.adminDeleteReview(reviewId);

    return true;
  }

}
