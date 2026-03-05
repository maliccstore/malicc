import { Resolver, Query, Arg, Ctx } from "type-graphql";
import { Service } from "typedi";
import { CouponService } from "../../../service/coupon.service";
import {
  CouponValidationResponse,
  ValidateCouponInput,
} from "../schemas/coupon.schema";

@Service()
@Resolver()
export class CouponResolver {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Validates a coupon against a given subtotal — no order needed.
   */
  @Query(() => CouponValidationResponse)
  async validateCoupon(
    @Arg("input") input: ValidateCouponInput,
    @Ctx() context: any
  ): Promise<CouponValidationResponse> {
    const userId = context?.user?.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate coupon using subtotal provided directly by the client
    const coupon = await this.couponService.validateCoupon(
      input.code,
      userId,
      input.subtotal
    );

    const discount = this.couponService.calculateDiscount(
      coupon,
      input.subtotal
    );

    const finalAmount = input.subtotal - discount < 0
      ? 0
      : input.subtotal - discount;

    return {
      success: true,
      message: "Coupon is valid",
      discount,
      finalAmount,
    };
  }
}
