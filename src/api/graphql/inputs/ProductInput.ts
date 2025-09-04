import { InputType, Field, Float } from "type-graphql";

@InputType()
export class CreateProductInput {
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

  @Field({ defaultValue: true })
  isActive!: boolean;

  @Field({ nullable: true })
  sku?: string;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field({ nullable: true })
  category?: string;

  @Field(() => [String], { nullable: true })
  imageUrl?: string[];

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  sku?: string;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  category?: string;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  search?: string;
}
