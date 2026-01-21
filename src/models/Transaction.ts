import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  AllowNull,
  Index,
} from "sequelize-typescript";
import { Order } from "./Order";
import User from "./UserModel";

@Table({
  tableName: "transactions",
  timestamps: true,
})
export class Transaction extends Model<Transaction> {
  @ForeignKey(() => Order)
  @Index
  @Column(DataType.UUID)
  orderId!: string;

  @ForeignKey(() => User)
  @AllowNull
  @Column(DataType.INTEGER)
  userId?: number;

  @Column(DataType.STRING)
  paymentProvider!: string; // stripe | razorpay

  @Index
  @Column(DataType.STRING)
  providerTransactionId!: string;

  @Column(DataType.INTEGER)
  amount!: number; // smallest unit

  @Column(DataType.STRING)
  currency!: string; // INR, USD

  @Column(
    DataType.ENUM("initiated", "authorized", "captured", "failed", "refunded"),
  )
  status!: string;

  @Column(DataType.ENUM("payment", "refund"))
  type!: string;

  @AllowNull
  @Column(DataType.TEXT)
  failureReason?: string;

  @Column(DataType.JSONB)
  providerResponse!: object;

  @Index
  @Column(DataType.STRING)
  idempotencyKey!: string;

  @AllowNull
  @Column(DataType.DATE)
  completedAt?: Date;
}
