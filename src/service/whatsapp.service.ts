import appConfig from "../config";
import {
  WhatsAppCampaign,
  CampaignStatus,
  MessageType,
} from "../models/WhatsAppCampaign";
import {
  WhatsAppCampaignRecipient,
  DeliveryStatus,
} from "../models/WhatsAppCampaignRecipient";
import User from "../models/UserModel";
import { Order } from "../models/Order";
import { Op, fn, col } from "sequelize";
import { OrderStatus } from "../enums/OrderStatus";
import { CustomerType } from "../enums/CustomerType";
import { PurchaseActivity } from "../enums/PurchaseActivity";
import { UserRole } from "../enums/UserRole";
import { usageService } from "./usage.service";
import { usageSyncService } from "./usage-sync.service";
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

  public formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return "";
    // Remove all non-numeric characters
    const cleaned = phoneNumber.toString().replace(/\D/g, "");

    // If it's 10 digits, assume India (91) and prefix it
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }

    // If it's already 12 digits starting with 91, return as is
    return cleaned;
  }

  public async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    components: any[] = [],
  ): Promise<{ messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { error: "WhatsApp API is not configured" };
    }

    try {
      const payload: any = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(to),
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      };

      if (components && components.length > 0) {
        payload.template.components = components;
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as any;
      console.log("Meta API Response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        return { error: data.error?.message || "Unknown Meta API Error" };
      }

      // Track billable WhatsApp message usage
      usageService.incrementWhatsAppMessages(1);
      usageSyncService.syncToHQ().catch(() => {});

      return { messageId: data.messages[0].id };
    } catch (error: any) {
      return { error: error.message || "Failed to send message" };
    }
  }

  public async sendPromotionalTemplate(
    to: string,
    templateName: string,
    data: {
      customerName: string;
      couponCode: string;
      bannerImageUrl?: string;
      language?: string;
    },
  ): Promise<{ messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { error: "WhatsApp API is not configured" };
    }

    try {
      // Temporarily using simple payload to match working manual tests
      const payload: any = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(to),
        type: "template",
        template: {
          name: templateName,
          language: {
            code: data.language || "en",
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: {
                    link:
                      data.bannerImageUrl ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "name",
                  text: data.customerName,
                },
                {
                  type: "text",
                  parameter_name: "coupon",
                  text: data.couponCode,
                },
              ],
            },
            {
              type: "button",
              sub_type: "copy_code",
              index: "0",
              parameters: [
                {
                  type: "coupon_code",
                  coupon_code: data.couponCode,
                },
              ],
            },
          ],
        },
      };

      console.log(`[WhatsAppService] Sending template: "${templateName}" to ${payload.to}`);
      console.log("[WhatsAppService] Full Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json()) as any;
      console.log("Meta API Response:", JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        return {
          error: responseData.error?.message || "Unknown Meta API Error",
        };
      }

      // Track billable WhatsApp message usage
      usageService.incrementWhatsAppMessages(1);
      usageSyncService.syncToHQ().catch(() => {});

      return { messageId: responseData.messages?.[0]?.id || "success" };
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

        // Fetch user to get customer name
        const user = await User.findByPk(recipient.userId);
        const customerName = user?.username || "Customer";
        const couponCode = campaign.couponCode || "";

        // Simple retry mechanism (up to 3 tries)
        let sent = false;
        let lastError = "";
        let metaId = "";

        for (let attempt = 1; attempt <= 3; attempt++) {
          let result;
          if (campaign.messageType === MessageType.PROMOTIONAL) {
            const fullBannerImageUrl = campaign.bannerImageUrl
              ? campaign.bannerImageUrl.startsWith("http")
                ? campaign.bannerImageUrl
                : `${appConfig.FRONTEND_URL || "https://example.com"}${campaign.bannerImageUrl}`
              : undefined;

            result = await this.sendPromotionalTemplate(
              recipient.phoneNumber,
              campaign.messageTemplate,
              {
                customerName,
                couponCode,
                bannerImageUrl: fullBannerImageUrl,
                language: campaign.language,
              },
            );
          } else {
            const components: any[] = [];
            if (campaign.bannerImageUrl) {
              components.push({
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: {
                      link: campaign.bannerImageUrl.startsWith("http")
                        ? campaign.bannerImageUrl
                        : `${appConfig.FRONTEND_URL || "https://example.com"}${campaign.bannerImageUrl}`,
                    },
                  },
                ],
              });
            }

            result = await this.sendTemplateMessage(
              recipient.phoneNumber,
              campaign.messageTemplate,
              campaign.language, // Or dynamic
              components,
            );
          }

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
          // Track billable WhatsApp message usage
          usageService.incrementWhatsAppMessages(1);
          usageSyncService.syncToHQ().catch(() => {});
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
    this.processCampaign(campaignId).catch((err) => {});
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

    if (
      purchasedWithinDays ||
      minSpent ||
      customerType === CustomerType.REPEAT ||
      customerType === CustomerType.INACTIVE
    ) {
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
            const daysSinceLastOrder =
              (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastOrder > purchasedWithinDays) return false;
          }

          // Customer Type Specific Order Logic
          if (customerType === CustomerType.REPEAT && orderCount < 2)
            return false;
          if (customerType === CustomerType.INACTIVE) {
            const daysSinceLastOrder =
              (now.getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24);
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

    const users = await User.findAll({ where: userWhere, attributes: ["id"] });
    return users.map((u) => u.id);
  }
}

export default new WhatsAppService();
