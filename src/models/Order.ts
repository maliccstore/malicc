import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Index,
  Default,
  HasMany,
} from "sequelize-typescript";

import { OrderStatus } from "../enums/OrderStatus";
import { Currency } from "../enums/Currency";
import { OrderItem } from "./OrderItem";

@Table({
  tableName: "orders",
  timestamps: true,
})
export class Order extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @AllowNull(true)
  @Index
  @Column(DataType.INTEGER)
  userId?: number;

  @AllowNull(true)
  @Index
  @Column(DataType.STRING)
  sessionId?: string;

  @Default(OrderStatus.CREATED)
  @Column(DataType.ENUM(...Object.values(OrderStatus)))
  status!: OrderStatus;

  @Column(DataType.DECIMAL(10, 2))
  subtotal!: number;

  @Column(DataType.DECIMAL(10, 2))
  tax!: number;

  @Column(DataType.DECIMAL(10, 2))
  shipping!: number;

  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @Default(Currency.INR)
  @Column(DataType.ENUM(...Object.values(Currency)))
  currency!: Currency;

  @HasMany(() => OrderItem)
  items!: OrderItem[];
}
