import { InputType, Field, Int } from "type-graphql";

@InputType()
export class TemplateVariableInput {
  @Field()
  key!: string;

  @Field()
  value!: string;
}

@InputType()
export class CampaignFiltersInput {
  @Field({ nullable: true })
  customerType?: string;

  @Field(() => Int, { nullable: true })
  purchasedWithinDays?: number;

  @Field(() => Int, { nullable: true })
  minSpent?: number;
}

@InputType()
export class SendWhatsAppCampaignInput {
  @Field()
  title!: string;

  @Field()
  templateName!: string;

  @Field({ defaultValue: "en_US" })
  templateLanguage!: string;

  @Field(() => [Int], { nullable: true })
  customerIds?: number[];

  @Field({ nullable: true })
  targetAll?: boolean;

  @Field(() => [TemplateVariableInput], { nullable: true })
  variables?: TemplateVariableInput[];

  @Field(() => CampaignFiltersInput, { nullable: true })
  filters?: CampaignFiltersInput;

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

@InputType()
export class SendProductAnnouncementInput {
  @Field()
  title!: string;

  @Field()
  templateName!: string;

  @Field()
  productId!: string;

  @Field()
  headline!: string;

  @Field({ nullable: true })
  ctaUrl?: string;

  @Field(() => [Int], { nullable: true })
  customerIds?: number[];

  @Field({ nullable: true })
  targetAll?: boolean;

  @Field(() => CampaignFiltersInput, { nullable: true })
  filters?: CampaignFiltersInput;
}

@InputType()
export class CampaignFilterInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  messageType?: string;
}
