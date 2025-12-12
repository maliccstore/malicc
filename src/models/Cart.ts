import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  Default,
  AllowNull,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";

import { Session } from "./Session";
import { CartItem } from "./CartItem";

@Table({
  tableName: "carts",
  timestamps: true,
})
export class Cart extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Session)
  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  sessionId!: string;

  @AllowNull(true)
  @Index
  @Column(DataType.INTEGER)
  userId?: number;

  // When items move out, we delete this
  @HasMany(() => CartItem)
  items!: CartItem[];

  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  totalAmount!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  totalItems!: number;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  lastUpdated!: Date;

  // Helper: recalc totals
  async recalcTotals() {
    const items = await this.$get("items");
    const totalItems = items!.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items!.reduce(
      (sum, i) => sum + Number(i.totalPrice),
      0
    );

    this.totalItems = totalItems;
    this.totalAmount = totalAmount;
    this.lastUpdated = new Date();

    await this.save();
  }
}
