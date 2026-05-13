import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";
import { Service } from "typedi";
import { requireAdmin } from "../../../middlewares/adminAuth";
import { Context } from "../context";
import {  WhatsAppCampaignResponse, WhatsAppCampaignsResponse } from "../schemas/whatsapp.schema";
import { SendWhatsAppCampaignInput, SendProductAnnouncementInput, CampaignFilterInput } from "../inputs/WhatsAppCampaign.input";
import { WhatsAppCampaign, MessageType } from "../../../models/WhatsAppCampaign";
import { WhatsAppCampaignRecipient } from "../../../models/WhatsAppCampaignRecipient";
import WhatsAppService from "../../../service/whatsapp.service";
import User from "../../../models/UserModel";

@Service()
@Resolver()
export class AdminMarketingResolver {
  @Authorized()
  @Mutation(() => WhatsAppCampaignResponse)
  async adminSendPromotionalWhatsApp(
    @Arg("input") input: SendWhatsAppCampaignInput,
    @Ctx() context: Context
  ): Promise<WhatsAppCampaignResponse> {
    requireAdmin(context);

    try {
      // 1. Create the campaign
      const campaign = await WhatsAppCampaign.create({
        title: input.title,
        messageTemplate: input.templateName,
        messageType: MessageType.PROMOTIONAL,
        createdBy: parseInt(context.user!.id, 10),
        productId: input.productId,
        bannerImageUrl: input.bannerImageUrl,
        headline: input.headline,
        offerMessage: input.offerMessage,
        ctaUrl: input.ctaUrl,
        language: input.templateLanguage || "en_US",
      });

      // 2. Resolve recipients
      let targetUserIds: number[] = [];
      if (input.targetAll) {
        const users = await User.findAll({ attributes: ['id'] });
        targetUserIds = users.map(u => u.id);
      } else if (input.customerIds && input.customerIds.length > 0) {
        targetUserIds = input.customerIds;
      } else if (input.filters) {
        targetUserIds = await WhatsAppService.getFinalAudienceIds({
          customerType: input.filters.customerType as any,
          purchasedWithinDays: input.filters.purchasedWithinDays as any,
          minSpent: input.filters.minSpent,
        });
      } else {
        throw new Error("No recipients specified");
      }

      const users = await User.findAll({
        where: { id: targetUserIds },
        attributes: ['id', 'phoneNumber']
      });

      console.log(`[WhatsAppCampaign] Found ${users.length} users for target IDs: ${targetUserIds.join(', ')}`);

      const validUsers = users.filter(user => user.phoneNumber && user.phoneNumber.toString().trim().length >= 10);

      if (validUsers.length === 0) {
        throw new Error("No valid users found with phone numbers for the provided recipient list");
      }

      // 3. Create recipients records
      const recipientRecords = validUsers.map(user => ({
        campaignId: campaign.id,
        userId: user.id,
        phoneNumber: user.phoneNumber,
      }));

      await WhatsAppCampaignRecipient.bulkCreate(recipientRecords);

      // 4. Update campaign total
      campaign.totalRecipients = recipientRecords.length;
      await campaign.save();

      // 5. Trigger background process
      await WhatsAppService.startCampaignQueue(campaign.id);

      return {
        success: true,
        message: "Promotional campaign queued successfully",
        campaign: campaign as any
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to start campaign"
      };
    }
  }

  @Authorized()
  @Mutation(() => WhatsAppCampaignResponse)
  async adminSendProductAnnouncement(
    @Arg("input") input: SendProductAnnouncementInput,
    @Ctx() context: Context
  ): Promise<WhatsAppCampaignResponse> {
    requireAdmin(context);

    try {
      // 1. Create the campaign
      const campaign = await WhatsAppCampaign.create({
        title: input.title,
        messageTemplate: input.templateName,
        messageType: MessageType.PRODUCT_ANNOUNCEMENT,
        createdBy: parseInt(context.user!.id, 10),
        productId: input.productId,
        language: "en_US", // Product announcements default to en_US for now or add to input
      });

      // 2. Resolve recipients
      let targetUserIds: number[] = [];
      if (input.targetAll) {
        const users = await User.findAll({ attributes: ['id'] });
        targetUserIds = users.map(u => u.id);
      } else if (input.customerIds && input.customerIds.length > 0) {
        targetUserIds = input.customerIds;
      } else if (input.filters) {
        targetUserIds = await WhatsAppService.getFinalAudienceIds({
          customerType: input.filters.customerType as any,
          purchasedWithinDays: input.filters.purchasedWithinDays as any,
          minSpent: input.filters.minSpent,
        });
      } else {
        throw new Error("No recipients specified");
      }

      const users = await User.findAll({
        where: { id: targetUserIds },
        attributes: ['id', 'phoneNumber']
      });

      if (users.length === 0) {
        throw new Error("No valid users found for the provided recipient list");
      }

      // 3. Create recipients records
      const recipientRecords = users.map(user => ({
        campaignId: campaign.id,
        userId: user.id,
        phoneNumber: user.phoneNumber,
      }));

      await WhatsAppCampaignRecipient.bulkCreate(recipientRecords);

      // 4. Update campaign total
      campaign.totalRecipients = recipientRecords.length;
      await campaign.save();

      // 5. Trigger background process
      await WhatsAppService.startCampaignQueue(campaign.id);

      return {
        success: true,
        message: "Product announcement campaign queued successfully",
        campaign: campaign as any
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to start campaign"
      };
    }
  }

  @Authorized()
  @Query(() => WhatsAppCampaignsResponse)
  async adminGetWhatsAppCampaigns(
    @Arg("filter", { nullable: true }) filter: CampaignFilterInput,
    @Ctx() context: Context
  ): Promise<WhatsAppCampaignsResponse> {
    requireAdmin(context);

    const where: any = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.messageType) {
      where.messageType = filter.messageType;
    }

    try {
      const campaigns = await WhatsAppCampaign.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      const count = await WhatsAppCampaign.count({ where });

      return {
        success: true,
        campaigns: campaigns as any,
        totalCount: count
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        campaigns: [],
        totalCount: 0
      };
    }
  }
}
