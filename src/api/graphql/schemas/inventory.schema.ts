// src/api/graphql/schemas/inventory.schema.ts
import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class InventorySchema {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  productId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  reservedQuantity!: number;

  @Field(() => Int)
  availableQuantity!: number;

  @Field(() => Boolean)
  isInStock!: boolean;

  @Field(() => Int)
  lowStockThreshold!: number;

  @Field(() => Boolean)
  trackQuantity!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
