import appConfig from "../config";
import { WhatsAppCampaign, CampaignStatus, MessageType } from "../models/WhatsAppCampaign";
import { WhatsAppCampaignRecipient, DeliveryStatus } from "../models/WhatsAppCampaignRecipient";
import User from "../models/UserModel";
import { Order } from "../models/Order";
import { Op, fn, col } from "sequelize";
import { OrderStatus } from "../enums/OrderStatus";
import { CustomerType } from "../enums/CustomerType";
import { PurchaseActivity } from "../enums/PurchaseActivity";
import { UserRole } from "../enums/UserRole";
import { EventService, EVENTS } from "../events";

class WhatsAppService {
  private apiUrl: string;
  private accessToken: string | undefined;
  private phoneNumberId: string | undefined;

  constructor() {
    this.accessToken = appConfig.META_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = appConfig.META_WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = `https://graph.facebook.com/${appConfig.META_WHATSAPP_API_VERSION}/${this.phoneNumberId}/messages`;
  }

  private isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  public async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en",
    components: any[] = []
  ): Promise<{ messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { error: "WhatsApp API is not configured" };
    }

    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: components,
        },
      };

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return { error: data.error?.message || "Unknown Meta API Error" };
      }

      return { messageId: data.messages[0].id };
    } catch (error: any) {
      return { error: error.message || "Failed to send message" };
    }
  }

  public async processCampaign(campaignId: number): Promise<void> {
    try {
      const campaign = await WhatsAppCampaign.findByPk(campaignId);
      if (!campaign) return;

      campaign.status = CampaignStatus.SENDING;
      await campaign.save();

      const recipients = await WhatsAppCampaignRecipient.findAll({
        where: { campaignId },
      });

      let successCount = 0;
      let failCount = 0;

      for (const recipient of recipients) {
        // Rate limiting: sleep slightly between messages to respect Meta API limits
        await new Promise((resolve) => setTimeout(resolve, 100)); // 10 messages/sec roughly

        const components: any[] = [];
        // Extract variables logic can be added here depending on template structure, e.g., mapping user details

        // Simple retry mechanism (up to 3 tries)
        let sent = false;
        let lastError = "";
        let metaId = "";

        for (let attempt = 1; attempt <= 3; attempt++) {
          const result = await this.sendTemplateMessage(
            recipient.phoneNumber,
            campaign.messageTemplate,
            "en", // Or dynamic
            components
          );

          if (result.messageId) {
            sent = true;
            metaId = result.messageId;
            break;
          } else {
            lastError = result.error || "Failed";
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000)); // Exponential backoff
          }
        }

        if (sent) {
          recipient.deliveryStatus = DeliveryStatus.SENT;
          recipient.metaMessageId = metaId;
          recipient.sentAt = new Date();
          successCount++;
        } else {
          recipient.deliveryStatus = DeliveryStatus.FAILED;
          recipient.errorMessage = lastError;
          failCount++;
        }
        await recipient.save();
      }

      campaign.status = CampaignStatus.COMPLETED;
      campaign.successfulCount = successCount;
      campaign.failedCount = failCount;
      await campaign.save();

      // 🎯 Emit campaign.sent event
      await EventService.emit({
        eventType: EVENTS.CAMPAIGN_SENT,
        storeId: process.env.STORE_ID || "unknown",
        payload: {
          id: campaign.id,
          name: campaign.title,
          successfulCount: successCount,
          failedCount: failCount,
        },
      });
    } catch (error: any) {
      console.error("Campaign processing error", error);
      const campaign = await WhatsAppCampaign.findByPk(campaignId);
      if (campaign) {
        campaign.status = CampaignStatus.FAILED;
        await campaign.save();

        // 🎯 Emit campaign.failed event
        await EventService.emit({
          eventType: EVENTS.CAMPAIGN_FAILED,
          storeId: process.env.STORE_ID || "unknown",
          payload: {
            id: campaign.id,
            error: error.message,
          },
        });
      }
    }
  }

  public async startCampaignQueue(campaignId: number): Promise<void> {
    // Fire and forget, runs in the background
    this.processCampaign(campaignId).catch((err) => {
      console.error(`Failed to process campaign ${campaignId}:`, err);
    });
  }

  public async estimateAudience(filters: {
    customerType?: CustomerType;
    purchasedWithinDays?: PurchaseActivity;
    minSpent?: number;
  }): Promise<number> {
    const userIds = await this.getFilteredUserIds(filters);

    const userWhere: any = {
      role: UserRole.CUSTOMER, // Only target customers
      phoneNumber: { [Op.ne]: null }, // Must have a phone number
    };

    if (filters.customerType === CustomerType.NEW) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      userWhere.createdAt = { [Op.gte]: thirtyDaysAgo };
    }

    if (userIds !== null) {
      userWhere.id = { [Op.in]: userIds };
    }

    return await User.count({ where: userWhere });
  }

  public async getFilteredUserIds(filters: {
    customerType?: CustomerType;
    purchasedWithinDays?: PurchaseActivity;
    minSpent?: number;
  }): Promise<number[] | null> {
    const { customerType, purchasedWithinDays, minSpent } = filters;

    // 1. Build User ID set based on Order criteria (Spent, Purchase Activity, Repeat/Inactive)
    let orderBasedUserIds: number[] | null = null;

    if (purchasedWithinDays || minSpent || customerType === CustomerType.REPEAT || customerType === CustomerType.INACTIVE) {
      const orderWhere: any = {
        status: { [Op.in]: [OrderStatus.PAID, OrderStatus.FULFILLED] },
      };

      const orders = await Order.findAll({
        where: orderWhere,
        attributes: [
          "userId",
          [fn("SUM", col("totalAmount")), "totalSpent"],
          [fn("COUNT", col("id")), "orderCount"],
          [fn("MAX", col("createdAt")), "lastOrderDate"],
        ],
        group: ["userId"],
      });

      const filteredIds = orders
        .filter((o: any) => {
          const totalSpent = parseFloat(o.get("totalSpent") || "0");
          const orderCount = parseInt(o.get("orderCount") || "0", 10);
          const lastOrderDate = new Date(o.get("lastOrderDate"));
          const now = new Date();

          // Spending Filter
          if (minSpent && totalSpent < minSpent) return false;

          // Purchased Within Days Filter
          if (purchasedWithinDays) {
            const daysSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastOrder > purchasedWithinDays) return false;
          }

          // Customer Type Specific Order Logic
          if (customerType === CustomerType.REPEAT && orderCount < 2) return false;
          if (customerType === CustomerType.INACTIVE) {
            const daysSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastOrder <= 90) return false;
          }

          return true;
        })
        .map((o: any) => o.userId)
        .filter((id): id is number => id !== null);

      orderBasedUserIds = filteredIds;
    }

    return orderBasedUserIds;
  }

  public async getFinalAudienceIds(filters: {
    customerType?: CustomerType;
    purchasedWithinDays?: PurchaseActivity;
    minSpent?: number;
  }): Promise<number[]> {
    const userIds = await this.getFilteredUserIds(filters);

    const userWhere: any = {
      role: UserRole.CUSTOMER, // Only target customers
      phoneNumber: { [Op.ne]: null }, // Must have a phone number
    };

    if (filters.customerType === CustomerType.NEW) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      userWhere.createdAt = { [Op.gte]: thirtyDaysAgo };
    }

    if (userIds !== null) {
      userWhere.id = { [Op.in]: userIds };
    }

    const users = await User.findAll({ where: userWhere, attributes: ['id'] });
    return users.map(u => u.id);
  }
}

export default new WhatsAppService();
