import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  AllowNull,
  BelongsTo,
  Default,
} from "sequelize-typescript";
import { Cart } from "./Cart";
import { Product } from "./ProductModel";

@Table({
  tableName: "cart_items",
  timestamps: true,
})
export class CartItem extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Cart)
  @AllowNull(false)
  @Column(DataType.UUID)
  cartId!: string;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.UUID)
  productId!: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  quantity!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  unitPrice!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  totalPrice!: number;

  @BelongsTo(() => Cart)
  cart!: Cart;

  @BelongsTo(() => Product)
  product!: Product;

  // Recalculate totals automatically
  calculateTotals(): void {
    this.totalPrice = Number(this.unitPrice) * this.quantity;
  }
}
