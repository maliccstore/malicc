import { ObjectType, Field, ID, Float, Int, InputType } from "type-graphql";

// INPUTS
@InputType()
export class AddToCartInput {
  @Field()
  productId!: string;

  @Field(() => Int)
  quantity!: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field()
  productId!: string;

  @Field(() => Int)
  quantity!: number;
}

// OBJECT TYPES
@ObjectType()
export class CartItem {
  @Field()
  productId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Float)
  price!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  addedAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  id!: string;

  @Field()
  sessionId!: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => [CartItem])
  items!: CartItem[];

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Int)
  totalItems!: number;

  @Field()
  lastUpdated!: Date;
}
