import { InputType, Field, Int, Float } from "type-graphql";

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
