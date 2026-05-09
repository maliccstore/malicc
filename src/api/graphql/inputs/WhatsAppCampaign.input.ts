import { InputType, Field, Int } from "type-graphql";

@InputType()
export class TemplateVariableInput {
  @Field()
  key!: string;

  @Field()
  value!: string;
}

@InputType()
export class SendWhatsAppCampaignInput {
  @Field()
  title!: string;

  @Field()
  templateName!: string;

  @Field({ defaultValue: "en" })
  templateLanguage!: string;

  @Field(() => [Int], { nullable: true })
  customerIds?: number[];

  @Field({ nullable: true })
  targetAll?: boolean;

  @Field(() => [TemplateVariableInput], { nullable: true })
  variables?: TemplateVariableInput[];
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
}

@InputType()
export class CampaignFilterInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  messageType?: string;
}
