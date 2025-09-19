import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";

import User from "../../../models/UserModel";
import { UserProfile } from "../schemas/user.schema";
import {
  requireAdmin,
  requireSuperAdmin,
} from "../../../middlewares/adminAuth";
import { Context } from "../context";
import { UserRole } from "../../../enums/UserRole";

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
}
