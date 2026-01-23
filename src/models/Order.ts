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
<<<<<<< HEAD
import Address from "./Address";
import { ForeignKey, BelongsTo } from "sequelize-typescript";
=======
>>>>>>> dev

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

  @ForeignKey(() => Address)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  addressId?: number;

  @BelongsTo(() => Address)
  address?: Address;

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

  @Column(DataType.JSON)
  shippingAddress!: any;

  @Column(DataType.DECIMAL(10, 2))
<<<<<<< HEAD
  shippingFee!: number;
=======
  shippingAddress!: number;
>>>>>>> dev

  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  paymentMethod?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  shippingMethod?: string;

  @Default(Currency.INR)
  @Column(DataType.ENUM(...Object.values(Currency)))
  currency!: Currency;

  @HasMany(() => OrderItem)
  items!: OrderItem[];
}
