import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
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
}
