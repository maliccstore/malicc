import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  Index,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import { TransactionStatus } from "../enums/TransactionStatus";
import { TransactionType } from "../enums/TransactionType";
import { Order } from "./Order";

@Table({
  tableName: "transactions",
  timestamps: true,
})
export class Transaction extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  orderId!: string;

  @AllowNull(true)
  @Index
  @Column(DataType.INTEGER)
  userId?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentProvider!: string;

  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  providerTransactionId!: string;

  /**
   * Amount in smallest currency unit
   * e.g. paise, cents
   */
  @AllowNull(false)
  @Column(DataType.INTEGER)
  amount!: number;

  @AllowNull(false)
  @Column(DataType.STRING(3))
  currency!: string;

  @Default(TransactionStatus.INITIATED)
  @Column(DataType.ENUM(...Object.values(TransactionStatus)))
  status!: TransactionStatus;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TransactionType)))
  type!: TransactionType;

  @AllowNull(true)
  @Column(DataType.TEXT)
  failureReason?: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  providerResponse!: Record<string, any>;

  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  idempotencyKey!: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  completedAt?: Date;

  // ── Razorpay-specific fields ──────────────────────────────────
  /**
   * Razorpay order ID (rzp_order_xxx)
   * Set during createPaymentOrder, before modal opens
   */
  @AllowNull(true)
  @Index
  @Column(DataType.STRING)
  razorpayOrderId?: string;

  /**
   * Razorpay payment ID (pay_xxx)
   * Set after user completes payment in modal
   */
  @AllowNull(true)
  @Index
  @Column(DataType.STRING)
  razorpayPaymentId?: string;

  /**
   * HMAC-SHA256 signature from Razorpay
   * Verified server-side before marking order PAID
   */
  @AllowNull(true)
  @Column(DataType.STRING(512))
  razorpaySignature?: string;
  // ─────────────────────────────────────────────────────────────

  @BelongsTo(() => Order)
  order?: Order;
}
