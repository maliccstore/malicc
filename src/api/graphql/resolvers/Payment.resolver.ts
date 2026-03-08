// graphql/payment.resolver.ts
import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { AuthenticationError, UserInputError } from "../../../errors";
import { Service } from "typedi";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../../../service/razorpay.service";
import { Order } from "../../../models/Order";
import { Transaction } from "../../../models/Transaction";
import { Coupon } from "../../../models/Coupon";
import { TransactionStatus } from "../../../enums/TransactionStatus";
import { TransactionType } from "../../../enums/TransactionType";
import {
  RazorpayOrderResponse,
  PaymentVerificationResult,
} from "../../../api/graphql/schemas/payment.schema";

interface Context {
  user?: { id: string };
}

@Service()
@Resolver()
export class PaymentResolver {
  /**
   * STEP 1 — Create Razorpay order
   * Frontend calls this first, then opens the Razorpay modal
   */
  @Authorized()
  @Mutation(() => RazorpayOrderResponse)
  async createPaymentOrder(
    @Arg("orderId", () => String) orderId: string,
    @Arg("couponCode", () => String, { nullable: true })
    couponCode: string | undefined,
    @Ctx() ctx: Context,
  ): Promise<RazorpayOrderResponse> {
    if (!ctx.user) throw new AuthenticationError("Login required");

    const order = await Order.findOne({
      where: { id: orderId, userId: ctx.user.id },
    });

    if (!order) throw new UserInputError("Order not found");
    if (order.status === "PAID") {
      throw new UserInputError("Order already paid");
    }

    let finalAmount: number = order.totalAmount;

    // Apply coupon if provided — reuses your existing coupon engine
    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode, isActive: true },
      });
      if (coupon && new Date() < new Date(coupon.validUntil)) {
        finalAmount =
          coupon.discountType === "PERCENTAGE"
            ? finalAmount - (finalAmount * coupon.discountValue) / 100
            : finalAmount - coupon.discountValue;
        finalAmount = Math.max(finalAmount, 0);
      }
    }

    const amountInPaise = Math.round(finalAmount * 100);
    const idempotencyKey = `order_${orderId}_${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      receipt: orderId,
      notes: { userId: ctx.user.id, orderId },
    });

    await Transaction.create({
      orderId,
      userId: Number(ctx.user.id),
      paymentProvider: "razorpay",
      providerTransactionId: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      status: TransactionStatus.INITIATED,
      type: TransactionType.PAYMENT,
      providerResponse: razorpayOrder,
      idempotencyKey,
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId,
      keyId: process.env.RAZORPAY_KEY_ID!,
    };
  }

  /**
   * STEP 2 — Verify payment after modal success callback
   * Always verify HMAC signature server-side
   */
  @Authorized()
  @Mutation(() => PaymentVerificationResult)
  async verifyPayment(
    @Arg("orderId", () => String) orderId: string,
    @Arg("razorpayOrderId", () => String) razorpayOrderId: string,
    @Arg("razorpayPaymentId", () => String) razorpayPaymentId: string,
    @Arg("razorpaySignature", () => String) razorpaySignature: string,
    @Ctx() ctx: Context,
  ): Promise<PaymentVerificationResult> {
    if (!ctx.user) throw new AuthenticationError("Login required");

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      console.error(
        `[Payment] Invalid signature — orderId: ${orderId}, user: ${ctx.user.id}`,
      );
      await Transaction.update(
        {
          status: TransactionStatus.FAILED,
          failureReason: "Signature verification failed",
          providerResponse: { razorpayOrderId, razorpayPaymentId },
        },
        { where: { orderId, razorpayOrderId } },
      );
      throw new UserInputError(
        "Payment verification failed. Please contact support.",
      );
    }

    await Transaction.update(
      {
        providerTransactionId: razorpayPaymentId,
        razorpayPaymentId,
        razorpaySignature,
        status: TransactionStatus.SUCCESS,
        completedAt: new Date(),
        providerResponse: {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
      },
      { where: { orderId, razorpayOrderId } },
    );

    await Order.update({ status: "PAID" }, { where: { id: orderId } });

    return { success: true, orderId, message: "Payment successful" };
  }
}
