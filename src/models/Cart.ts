import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  Default,
  AllowNull,
  ForeignKey,
} from "sequelize-typescript";
import { Session } from "./Session";

@Table({
  tableName: "carts",
  timestamps: true,
  indexes: [
    {
      name: "carts_session_id_index",
      fields: ["sessionId"],
    },
    {
      name: "carts_user_id_index",
      fields: ["userId"],
    },
  ],
})
export class Cart extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Index("carts_session_id_index")
  @ForeignKey(() => Session)
  @AllowNull(false)
  @Column(DataType.STRING)
  sessionId!: string;

  @Index("carts_user_id_index")
  @AllowNull(true)
  @Column(DataType.INTEGER)
  userId?: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  items!: any[];

  @Default(0)
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalAmount!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  totalItems!: number;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  lastUpdated!: Date;

  // Helper method to calculate totals
  calculateTotals(): void {
    this.totalItems = this.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    this.totalAmount = this.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
  }

  // Helper to find item in cart
  findItem(productId: string): any | null {
    return this.items.find((item: any) => item.productId === productId) || null;
  }
}
