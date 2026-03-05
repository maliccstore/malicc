import { ObjectType, Field, Float, InputType } from "type-graphql";

@ObjectType()
export class CouponValidationResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Float, { nullable: true })
  discount?: number;

  @Field(() => Float, { nullable: true })
  finalAmount?: number;
}

@InputType()
export class ValidateCouponInput {
  @Field()
  code!: string;

  @Field(() => Float)
  subtotal!: number;
}
