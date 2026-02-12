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

  @BelongsTo(() => Order)
  order?: Order;
}
