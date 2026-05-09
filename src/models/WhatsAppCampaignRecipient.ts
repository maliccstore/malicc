import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Optional } from "sequelize";
import { WhatsAppCampaign } from "./WhatsAppCampaign";
import User from "./UserModel";

export enum DeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

interface WhatsAppCampaignRecipientAttributes {
  id: number;
  campaignId: number;
  userId: number;
  phoneNumber: string;
  deliveryStatus: DeliveryStatus;
  metaMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}

type WhatsAppCampaignRecipientCreationAttributes = Optional<
  WhatsAppCampaignRecipientAttributes,
  | "id"
  | "deliveryStatus"
  | "metaMessageId"
  | "errorMessage"
  | "sentAt"
>;

@Table({
  tableName: "whatsapp_campaign_recipients",
  timestamps: false,
})
export class WhatsAppCampaignRecipient extends Model<
  WhatsAppCampaignRecipientAttributes,
  WhatsAppCampaignRecipientCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number;

  @ForeignKey(() => WhatsAppCampaign)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public campaignId!: number;

  @BelongsTo(() => WhatsAppCampaign)
  public campaign!: WhatsAppCampaign;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  public phoneNumber!: string;

  @Default(DeliveryStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(DeliveryStatus)))
  public deliveryStatus!: DeliveryStatus;

  @AllowNull(true)
  @Column(DataType.STRING)
  public metaMessageId?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public errorMessage?: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  public sentAt?: Date;
}
