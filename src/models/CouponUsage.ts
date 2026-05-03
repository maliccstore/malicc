import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Index,
  Default,
} from "sequelize-typescript";
import { Coupon } from "./Coupon";
import User from "./UserModel";
import { Order } from "./Order";

@Table({
  tableName: "coupon_usages",
  timestamps: true,
})
export class CouponUsage extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Coupon)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  couponId!: string;

  @BelongsTo(() => Coupon)
  coupon!: Coupon;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.INTEGER)
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Order)
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  orderId?: string;

  @BelongsTo(() => Order)
  order?: Order;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  usedAt!: Date;
}
