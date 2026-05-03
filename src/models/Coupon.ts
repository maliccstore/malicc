import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  HasMany,
  Index,
} from "sequelize-typescript";
import { DiscountType } from "../enums/DiscountType";
import { Order } from "./Order";

@Table({
  tableName: "coupons",
  timestamps: true,
})
export class Coupon extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @AllowNull(false)
  @Index({ unique: true })
  @Column(DataType.STRING(50))
  code!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DiscountType)))
  discountType!: DiscountType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  discountValue!: number;

  @AllowNull(true)
  @Column(DataType.DECIMAL(10, 2))
  maxDiscount?: number;

  @AllowNull(true)
  @Column(DataType.DECIMAL(10, 2))
  minOrderValue?: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  usageLimit?: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  perUserLimit?: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  validFrom!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  validUntil!: Date;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  usedCount!: number;

  @HasMany(() => Order)
  orders!: Order[];
}
