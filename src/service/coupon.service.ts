import { Service } from "typedi";
import { Coupon } from "../models/Coupon";
import { CouponUsage } from "../models/CouponUsage";
import { Order } from "../models/Order";
import { DiscountType } from "../enums/DiscountType";

@Service()
export class CouponService {
  async validateCoupon(
    code: string,
    userId: number,
    subtotal: number,
  ): Promise<Coupon> {
    const coupon = await Coupon.findOne({
      where: { code, isActive: true },
    });

    if (!coupon) {
      throw new Error("Invalid or inactive coupon");
    }

    const now = new Date();

    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new Error("Coupon is expired or not yet active");
    }

    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new Error(`Minimum order value of ${coupon.minOrderValue} not met`);
    }

    if (coupon.usageLimit) {
      const totalUsage = await CouponUsage.count({
        where: { couponId: coupon.id },
      });

      if (totalUsage >= coupon.usageLimit) {
        throw new Error("Coupon usage limit exceeded");
      }
    }

    if (coupon.perUserLimit) {
      const userUsage = await CouponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsage >= coupon.perUserLimit) {
        throw new Error("You have exceeded the usage limit for this coupon");
      }
    }

    return coupon;
  }

  calculateDiscount(coupon: Coupon, subtotal: number): number {
    let discount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
    }

    if (coupon.discountType === DiscountType.FIXED) {
      discount = Number(coupon.discountValue);
    }

    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }

    return Number(discount.toFixed(2));
  }

  async applyCoupon(
    orderId: string,
    code: string,
    userId: number,
  ): Promise<Order> {
    return await Order.sequelize!.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, { transaction });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      const coupon = await this.validateCoupon(
        code,
        userId,
        Number(order.subtotal),
      );

      const discount = this.calculateDiscount(coupon, Number(order.subtotal));

      const newTotal = Number(order.totalAmount) - discount;

      await order.update(
        {
          couponId: coupon.id,
          totalAmount: newTotal < 0 ? 0 : newTotal,
        },
        { transaction },
      );

      return order;
    });
  }

  async recordCouponUsage(
    couponId: string,
    userId: number,
    orderId: string,
  ): Promise<void> {
    await Coupon.sequelize!.transaction(async (transaction) => {
      const existingUsage = await CouponUsage.findOne({
        where: { couponId, orderId },
        transaction,
      });

      if (existingUsage) {
        return;
      }

      await CouponUsage.create(
        {
          couponId,
          userId,
          orderId,
        },
        { transaction },
      );

      await Coupon.increment("usedCount", {
        by: 1,
        where: { id: couponId },
        transaction,
      });
    });
  }
}
