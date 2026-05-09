import appConfig from "../config";
import { WhatsAppCampaign, CampaignStatus, MessageType } from "../models/WhatsAppCampaign";
import { WhatsAppCampaignRecipient, DeliveryStatus } from "../models/WhatsAppCampaignRecipient";

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
    } catch (error) {
      console.error("Campaign processing error", error);
      const campaign = await WhatsAppCampaign.findByPk(campaignId);
      if (campaign) {
        campaign.status = CampaignStatus.FAILED;
        await campaign.save();
      }
    }
  }

  public async startCampaignQueue(campaignId: number): Promise<void> {
    // Fire and forget, runs in the background
    this.processCampaign(campaignId).catch((err) => {
      console.error(`Failed to process campaign ${campaignId}:`, err);
    });
  }
}

export default new WhatsAppService();
