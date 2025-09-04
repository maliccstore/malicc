import { ObjectType, Field, ID, Float } from "type-graphql";

@ObjectType()
export class Product {
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
}

@ObjectType()
export class ProductResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Product, { nullable: true })
  product?: Product;
}

@ObjectType()
export class ProductsResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [Product])
  products!: Product[];

  @Field(() => Float)
  totalCount!: number;
}
