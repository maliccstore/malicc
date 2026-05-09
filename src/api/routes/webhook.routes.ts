import { Router } from "express";
import { Container } from "typedi";
import { OrderService } from "../../service/order.service";
import { verifyWebhookSignature } from "../../service/razorpay.service";
import { Transaction } from "../../models/Transaction";
import { TransactionStatus } from "../../enums/TransactionStatus";
import { OrderStatus } from "../../enums/OrderStatus";
import appConfig from "../../config";
import { WhatsAppCampaignRecipient, DeliveryStatus } from "../../models/WhatsAppCampaignRecipient";
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

/**
 * WhatsApp Meta Webhook Handler
 * GET /api/webhooks/whatsapp (Verification)
 * POST /api/webhooks/whatsapp (Status Updates)
 */
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === appConfig.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log("✅ WhatsApp Webhook Verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

router.post("/whatsapp", async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.statuses
    ) {
      const statusObj = body.entry[0].changes[0].value.statuses[0];
      const messageId = statusObj.id;
      const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
      
      try {
        const recipient = await WhatsAppCampaignRecipient.findOne({ where: { metaMessageId: messageId } });
        if (recipient) {
          switch (status) {
            case "sent":
              recipient.deliveryStatus = DeliveryStatus.SENT;
              break;
            case "delivered":
              recipient.deliveryStatus = DeliveryStatus.DELIVERED;
              break;
            case "read":
              recipient.deliveryStatus = DeliveryStatus.READ;
              break;
            case "failed":
              recipient.deliveryStatus = DeliveryStatus.FAILED;
              recipient.errorMessage = JSON.stringify(statusObj.errors || "Failed");
              break;
          }
          await recipient.save();
          console.log(`🔔 WhatsApp Message ${messageId} status updated to ${status}`);
        }
      } catch (error) {
        console.error("❌ Error updating WhatsApp message status:", error);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

export default router;
