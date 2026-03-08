// graphql/payment.types.ts
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
export class RazorpayOrderResponse {
  @Field()
  razorpayOrderId!: string;

  @Field(() => Int)
  amount!: number; // in paise

  @Field()
  currency!: string;

  @Field()
  receipt!: string;

  @Field()
  keyId!: string;
}

@ObjectType()
export class PaymentVerificationResult {
  @Field()
  success!: boolean;

  @Field()
  orderId!: string;

  @Field()
  message!: string;
}
