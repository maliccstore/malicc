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
} from "sequelize-typescript";

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
    type: DataType.STRING(100),
    allowNull: false,
  })
  category!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
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

  // Add full-text search vector column
  @Column({
    type: DataType.TSVECTOR,
    allowNull: true,
  })
  search_vector!: any;

  @BeforeSave
  @BeforeUpdate
  static async updateSearchVector(instance: Product) {
    // Update the search vector using PostgreSQL's to_tsvector function
    const [result] = await Product.sequelize!.query(
      `SELECT to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')) as vector`
    );

    if (result && result.length > 0) {
      instance.search_vector = (result[0] as any).vector;
    }
  }
}
