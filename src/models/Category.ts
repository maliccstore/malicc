import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  Index,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";

import { Product } from "./ProductModel";

@Table({
  tableName: "categories",
  timestamps: true,
})
export class Category extends Model<Category> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @AllowNull(false)
  @Index({ unique: true })
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Index({ unique: true })
  @Column(DataType.STRING)
  slug!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description?: string;

  // Self-referencing parent category
  @ForeignKey(() => Category)
  @AllowNull(true)
  @Column(DataType.UUID)
  parentId?: string;

  @BelongsTo(() => Category, "parentId")
  parent?: Category;

  @HasMany(() => Category, "parentId")
  children?: Category[];

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  sortOrder!: number;

  // Relations
  @HasMany(() => Product)
  products?: Product[];
}
