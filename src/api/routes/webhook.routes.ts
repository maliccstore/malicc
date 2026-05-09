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

      const transaction = await Transaction.findOne({
        where: { razorpayOrderId },
      });

      if (transaction && transaction.status !== TransactionStatus.FAILED) {
        await transaction.update({
          status: TransactionStatus.FAILED,
          failureReason: "Payment failed (webhook notification)",
          razorpayPaymentId,
          providerResponse: req.body,
        });

        await orderService.updateOrderStatus(
          transaction.orderId,
          OrderStatus.FAILED,
        );

        console.log(
          `❌ Order ${transaction.orderId} marked as FAILED via webhook`,
        );
      }
    } else if (event === "order.paid") {
      const razorpayOrderId = payload.order.entity.id;

      const transaction = await Transaction.findOne({
        where: { razorpayOrderId },
      });

      if (transaction && transaction.status !== TransactionStatus.SUCCESS) {
        await transaction.update({
          status: TransactionStatus.SUCCESS,
          completedAt: new Date(),
          providerResponse: req.body,
        });

        await orderService.updateOrderStatus(
          transaction.orderId,
          OrderStatus.PAID,
        );

        console.log(
          `✅ Order ${transaction.orderId} marked as PAID via webhook`,
        );
      }
    }

    return res.status(200).send("ok");
  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    return res.status(500).send("Webhook processing failed");
  }
});

/**
 * WhatsApp Webhook Verification
 * GET /api/webhooks/whatsapp
 */
router.get("/whatsapp", (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"] as string;

  const token = req.query["hub.verify_token"] as string;

  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ WhatsApp webhook verified");

    return res.status(200).send(challenge);
  }

  console.warn("❌ WhatsApp webhook verification failed");

  return res.sendStatus(403);
});

/**
 * WhatsApp Incoming Events
 * POST /api/webhooks/whatsapp
 */
router.post("/whatsapp", async (req, res) => {
  try {
    console.log("📩 WhatsApp Webhook:", JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    /**
     * Incoming messages
     */
    const messages = value?.messages;

    if (messages?.length) {
      const message = messages[0];

      const from = message.from;
      const text = message?.text?.body;

      console.log(`📨 Message from ${from}: ${text}`);

      /**
       * Handle customer message here
       */
    }

    /**
     * Delivery/read status
     */
    const statuses = value?.statuses;

    if (statuses?.length) {
      const status = statuses[0];

      console.log(`📬 Message ${status.id} status: ${status.status}`);

      /**
       * Update DB if needed
       */
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error);

    return res.sendStatus(500);
  }
});

export default router;
