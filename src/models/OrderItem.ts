import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import { Order } from "./Order";
import { Product } from "./ProductModel";

@Table({
  tableName: "order_items",
  timestamps: true,
})
export class OrderItem extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Order)
  @Column(DataType.UUID)
  orderId!: string;

  @ForeignKey(() => Product)
  @Column(DataType.UUID)
  productId!: string;

  // snapshot fields
  @Column(DataType.STRING)
  productName!: string;

  @Column(DataType.DECIMAL(10, 2))
  unitPrice!: number;

  @Column(DataType.INTEGER)
  quantity!: number;

  @Column(DataType.DECIMAL(10, 2))
  totalPrice!: number;

  @BelongsTo(() => Order)
  order!: Order;
}
