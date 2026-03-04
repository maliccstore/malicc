import { Resolver, Query, Arg, Ctx } from "type-graphql";
import { Service } from "typedi";
import { CouponService } from "../../../service/coupon.service";
import {
  CouponValidationResponse,
  ValidateCouponInput,
} from "../schemas/coupon.schema";
import { Order } from "../../../models/Order";

@Service()
@Resolver()
export class CouponResolver {
  constructor(private readonly couponService: CouponService) {}

  @Query(() => CouponValidationResponse)
  async validateCoupon(
    @Arg("input") input: ValidateCouponInput,
    @Ctx() context: any,
  ): Promise<CouponValidationResponse> {
    const userId = context?.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const order = await Order.findByPk(input.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const coupon = await this.couponService.validateCoupon(
      input.code,
      userId,
      Number(order.subtotal),
    );

    const discount = this.couponService.calculateDiscount(
      coupon,
      Number(order.subtotal),
    );

    const finalAmount =
      Number(order.totalAmount) - discount < 0
        ? 0
        : Number(order.totalAmount) - discount;

    return {
      success: true,
      message: "Coupon is valid",
      discount,
      finalAmount,
    };
  }
}
