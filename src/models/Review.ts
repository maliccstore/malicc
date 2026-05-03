import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Min,
  Max,
} from "sequelize-typescript";
import { Product } from "./ProductModel";
import { Order } from "./Order";
import User from "./UserModel";
import { ReviewStatus } from "../enums/ReviewStatus";

@Table({
  tableName: "reviews",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "productId"],
      name: "reviews_userId_productId_unique",
    },
  ],
})
export class Review extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER, // changed to integer to match UserModel.ts
  })
  userId!: number;

  @BelongsTo(() => User)
  user?: User;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  productId!: string;

  @BelongsTo(() => Product)
  product?: Product;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
  })
  orderId!: string;

  @BelongsTo(() => Order)
  order?: Order;

  @Min(1)
  @Max(5)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  rating!: number;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
  })
  reviewText?: string;

  @Default(ReviewStatus.PENDING)
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ReviewStatus)),
  })
  status!: ReviewStatus;

  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;
}
