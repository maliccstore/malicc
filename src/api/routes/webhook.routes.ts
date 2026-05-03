import { Router } from "express";
import { Container } from "typedi";
import { OrderService } from "../../service/order.service";
import { verifyWebhookSignature } from "../../service/razorpay.service";
import { Transaction } from "../../models/Transaction";
import { TransactionStatus } from "../../enums/TransactionStatus";
import { OrderStatus } from "../../enums/OrderStatus";

const router = Router();

/**
 * Razorpay Webhook Handler
 * POST /api/webhooks/razorpay
 */
router.post("/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET is not defined");
    return res.status(500).send("Configuration error");
  }

  // Use raw body for signature verification if possible, but express.json() usually works if not modified
  const bodyString = JSON.stringify(req.body);

  if (!verifyWebhookSignature(bodyString, signature, webhookSecret)) {
    console.warn("⚠️ Invalid Razorpay webhook signature received");
    return res.status(400).send("Invalid signature");
  }

  const { event, payload } = req.body;
  const orderService = Container.get(OrderService);

  console.log(`🔔 Razorpay Webhook received: ${event}`);

  try {
    if (event === "payment.failed") {
      const razorpayPaymentId = payload.payment.entity.id;
      const razorpayOrderId = payload.payment.entity.order_id;

      const transaction = await Transaction.findOne({ where: { razorpayOrderId } });
      if (transaction && transaction.status !== TransactionStatus.FAILED) {
        await transaction.update({
          status: TransactionStatus.FAILED,
          failureReason: "Payment failed (webhook notification)",
          razorpayPaymentId,
          providerResponse: req.body,
        });

        await orderService.updateOrderStatus(transaction.orderId, OrderStatus.FAILED);
        console.log(`❌ Order ${transaction.orderId} marked as FAILED via webhook`);
      }
    } else if (event === "order.paid") {
      const razorpayOrderId = payload.order.entity.id;
      const transaction = await Transaction.findOne({ where: { razorpayOrderId } });

      if (transaction && transaction.status !== TransactionStatus.SUCCESS) {
        await transaction.update({
          status: TransactionStatus.SUCCESS,
          completedAt: new Date(),
          providerResponse: req.body,
        });

        await orderService.updateOrderStatus(transaction.orderId, OrderStatus.PAID);
        console.log(`✅ Order ${transaction.orderId} marked as PAID via webhook`);
      }
    }

    res.status(200).send("ok");
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).send("Webhook processing failed");
  }
});

export default router;
