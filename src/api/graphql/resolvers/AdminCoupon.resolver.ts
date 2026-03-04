import { Resolver, Query, Mutation, Arg, Authorized } from "type-graphql";
import { Service } from "typedi";
import { UserRole } from "../../../enums/UserRole";
import { CouponService } from "../../../service/coupon.service";
import {
  CouponSchema,
  CouponResponse,
  CouponsResponse,
  CreateCouponInput,
  UpdateCouponInput,
} from "../schemas/adminCoupon.schema";
import { Coupon } from "../../../models/Coupon";

@Service()
@Resolver(() => CouponSchema)
export class AdminCouponResolver {
  constructor(private readonly couponService: CouponService) {}

  private mapToSchema(coupon: Coupon): CouponSchema {
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      minOrderValue: coupon.minOrderValue
        ? Number(coupon.minOrderValue)
        : undefined,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      usedCount: coupon.usedCount,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CouponResponse)
  async createCoupon(
    @Arg("input") input: CreateCouponInput,
  ): Promise<CouponResponse> {
    try {
      const coupon = await this.couponService.createCoupon(input);
      return {
        success: true,
        message: "Coupon created successfully",
        coupon: this.mapToSchema(coupon),
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create coupon",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CouponResponse)
  async updateCoupon(
    @Arg("id") id: string,
    @Arg("input") input: UpdateCouponInput,
  ): Promise<CouponResponse> {
    try {
      const coupon = await this.couponService.updateCoupon(id, input);
      return {
        success: true,
        message: "Coupon updated successfully",
        coupon: coupon ? this.mapToSchema(coupon) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update coupon",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => CouponResponse)
  async disableCoupon(@Arg("id") id: string): Promise<CouponResponse> {
    try {
      const coupon = await this.couponService.disableCoupon(id);
      return {
        success: true,
        message: "Coupon disabled successfully",
        coupon: coupon ? this.mapToSchema(coupon) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to disable coupon",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Query(() => CouponsResponse)
  async listCoupons(
    @Arg("isActive", { nullable: true }) isActive?: boolean,
    @Arg("limit", { nullable: true }) limit?: number,
    @Arg("offset", { nullable: true }) offset?: number,
  ): Promise<CouponsResponse> {
    try {
      const { coupons, totalCount } = await this.couponService.listCoupons({
        isActive,
        limit,
        offset,
      });

      return {
        success: true,
        message: "Coupons fetched successfully",
        coupons: coupons.map((c) => this.mapToSchema(c)),
        totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch coupons. Error: ${error}`,
        coupons: [],
        totalCount: 0,
      };
    }
  }
}
