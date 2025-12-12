import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  AllowNull,
  Default,
  BelongsTo,
} from "sequelize-typescript";
import { Product } from "./ProductModel";

@Table({
  tableName: "inventory",
  timestamps: true,
})
export class Inventory extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.UUID)
  productId!: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  quantity!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  reservedQuantity!: number;

  @Default(10)
  @Column(DataType.INTEGER)
  lowStockThreshold!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  trackQuantity!: boolean;

  // Virtual field for available quantity
  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }

  // Check if product is in stock
  isInStock(quantity: number = 1): boolean {
    if (!this.trackQuantity) return true;
    return this.availableQuantity >= quantity;
  }

  // Reserve items for cart
  async reserve(quantity: number): Promise<boolean> {
    return await this.sequelize!.transaction(async (t) => {
      await this.reload({ lock: t.LOCK.UPDATE, transaction: t });

      if (!this.isInStock(quantity)) return false;

      this.reservedQuantity += quantity;
      await this.save({ transaction: t });

      return true;
    });
  }

  // Release reserved items
  async release(quantity: number): Promise<void> {
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
    await this.save();
  }

  // Commit reservation to actual sale
  async commit(quantity: number): Promise<void> {
    this.quantity -= quantity;
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
    await this.save();
  }

  // Restock inventory
  async restock(quantity: number): Promise<void> {
    this.quantity += quantity;
    await this.save();
  }

  @BelongsTo(() => Product)
  product!: Product;
}
