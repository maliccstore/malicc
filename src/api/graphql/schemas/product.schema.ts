// src/api/graphql/schemas/product.schema.ts
import { ObjectType, Field, ID, Float, InputType } from "type-graphql";
import { InventorySchema } from "./inventory.schema";

@ObjectType()
export class ProductSchema {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => Float)
  price!: number;

  @Field()
  category!: string;

  @Field(() => [String])
  imageUrl!: string[];

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  sku?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  search_vector?: string;

  // Use the InventorySchema instead of the model
  // @Field(() => InventorySchema, { nullable: true })
  // inventory?: InventorySchema;

  // @Field(() => Boolean)
  // inStock!: boolean;

  // @Field(() => Float)
  // availableQuantity!: number;
}

@ObjectType()
export class ProductResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => ProductSchema, { nullable: true })
  product?: ProductSchema;
}

@ObjectType()
export class ProductsResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [ProductSchema])
  products!: ProductSchema[];

  @Field(() => Float)
  totalCount!: number;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  minPrice?: number;

  @Field({ nullable: true })
  maxPrice?: number;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  search?: string;
}
