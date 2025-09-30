import { ObjectType, Field, ID, Float, Int } from "type-graphql";

@ObjectType()
export class CartItemType {
  @Field(() => ID)
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
export class CartType {
  @Field(() => ID)
  id!: string;

  @Field()
  sessionId!: string;

  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => [CartItemType])
  items!: CartItemType[];

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => Int)
  totalItems!: number;

  @Field()
  lastUpdated!: Date;
}
