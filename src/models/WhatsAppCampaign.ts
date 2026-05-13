import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from "sequelize-typescript";
import { Optional } from "sequelize";
import { WhatsAppCampaignRecipient } from "./WhatsAppCampaignRecipient";

export enum CampaignStatus {
  DRAFT = "DRAFT",
  SENDING = "SENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum MessageType {
  PROMOTIONAL = "PROMOTIONAL",
  PRODUCT_ANNOUNCEMENT = "PRODUCT_ANNOUNCEMENT",
}

interface WhatsAppCampaignAttributes {
  id: number;
  title: string;
  messageTemplate: string;
  messageType: MessageType;
  status: CampaignStatus;
  totalRecipients: number;
  successfulCount: number;
  failedCount: number;
  createdBy: number;
  productId?: string;
  bannerImageUrl?: string;
  headline?: string;
  offerMessage?: string;
  ctaUrl?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

type WhatsAppCampaignCreationAttributes = Optional<
  WhatsAppCampaignAttributes,
  | "id"
  | "status"
  | "totalRecipients"
  | "successfulCount"
  | "failedCount"
  | "language"
  | "createdAt"
  | "updatedAt"
>;

@Table({
  tableName: "whatsapp_campaigns",
  timestamps: true,
})
export class WhatsAppCampaign extends Model<
  WhatsAppCampaignAttributes,
  WhatsAppCampaignCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public title!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public messageTemplate!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(MessageType)))
  public messageType!: MessageType;

  @Default(CampaignStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(CampaignStatus)))
  public status!: CampaignStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  public totalRecipients!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  public successfulCount!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  public failedCount!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public createdBy!: number;

  @AllowNull(true)
  @Column(DataType.UUID)
  public productId?: string;

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  public bannerImageUrl?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public headline?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public offerMessage?: string;

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  public ctaUrl?: string;

  @Default("en_US")
  @Column(DataType.STRING(10))
  public language!: string;

  @CreatedAt
  @Column(DataType.DATE)
  public readonly createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  public readonly updatedAt!: Date;

  @HasMany(() => WhatsAppCampaignRecipient)
  recipients!: WhatsAppCampaignRecipient[];
}
