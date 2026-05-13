import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class WhatsAppCampaignSchema {
  @Field(() => ID)
  id!: number;

  @Field()
  title!: string;

  @Field()
  messageTemplate!: string;

  @Field()
  messageType!: string;

  @Field()
  status!: string;

  @Field(() => Int)
  totalRecipients!: number;

  @Field(() => Int)
  successfulCount!: number;

  @Field(() => Int)
  failedCount!: number;

  @Field(() => Int)
  createdBy!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  bannerImageUrl?: string;

  @Field({ nullable: true })
  headline?: string;

  @Field({ nullable: true })
  offerMessage?: string;

  @Field({ nullable: true })
  ctaUrl?: string;
}

@ObjectType()
export class WhatsAppCampaignResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => WhatsAppCampaignSchema, { nullable: true })
  campaign?: WhatsAppCampaignSchema;
}

@ObjectType()
export class WhatsAppCampaignsResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [WhatsAppCampaignSchema])
  campaigns!: WhatsAppCampaignSchema[];

  @Field(() => Int)
  totalCount!: number;
}
