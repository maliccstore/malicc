// src/models/Product.ts
import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
  BeforeSave,
  BeforeUpdate,
  HasOne,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Inventory } from "./Inventory";
import { QueryTypes } from "sequelize";
import { Category } from "./Category";

@Table({
  tableName: "products",
  timestamps: true,
})
export class Product extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: false,
    defaultValue: [],
  })
  imageUrl!: string[];

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isActive!: boolean;

  @AllowNull
  @Column({
    type: DataType.STRING(100),
  })
  sku?: string;

  @ForeignKey(() => Category)
  @Column(DataType.UUID)
  categoryId!: string;

  @BelongsTo(() => Category)
  category?: Category;

  // Add full-text search vector column
  @Column({
    type: DataType.TSVECTOR,
    allowNull: true,
  })
  search_vector?: any;

  @BeforeSave
  @BeforeUpdate
  static async updateSearchVector(instance: Product) {
    try {
      // Use the instance values directly instead of querying the database
      const searchText = `${instance.name || ""} ${instance.description || ""
        }`.trim();

      if (searchText) {
        const [result] = await Product.sequelize!.query(
          `SELECT to_tsvector('english', $1) as vector`,
          {
            bind: [searchText],
            type: QueryTypes.SELECT,
          },
        );

        instance.search_vector = (result as any).vector;
      }
    } catch (error) {
      console.error("Error updating search vector:", error);
      // Don't throw error to prevent blocking product creation
    }
  }

  @HasOne(() => Inventory)
  inventory!: Inventory;

  // Add inventory check method
  async checkStock(quantity: number = 1): Promise<boolean> {
    const inventory = await this.$get("inventory");
    return inventory ? inventory.isInStock(quantity) : false;
  }

  // Get available quantity
  async getAvailableQuantity(): Promise<number> {
    const inventory = await this.$get("inventory");
    return inventory ? inventory.availableQuantity : 0;
  }
}
