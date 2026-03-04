import { ObjectType, Field, ID, Float, Int, InputType } from "type-graphql";
import { DiscountType } from "../../../enums/DiscountType";

@ObjectType()
export class CouponSchema {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field(() => DiscountType)
  discountType!: DiscountType;

  @Field(() => Float)
  discountValue!: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field(() => Float, { nullable: true })
  minOrderValue?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @Field()
  validFrom!: Date;

  @Field()
  validUntil!: Date;

  @Field()
  isActive!: boolean;

  @Field(() => Int)
  usedCount!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class CouponResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => CouponSchema, { nullable: true })
  coupon?: CouponSchema;
}

@ObjectType()
export class CouponsResponse {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => [CouponSchema])
  coupons!: CouponSchema[];

  @Field(() => Int)
  totalCount!: number;
}

@InputType()
export class CreateCouponInput {
  @Field()
  code!: string;

  @Field(() => DiscountType)
  discountType!: DiscountType;

  @Field(() => Float)
  discountValue!: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field(() => Float, { nullable: true })
  minOrderValue?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @Field()
  validFrom!: Date;

  @Field()
  validUntil!: Date;
}

@InputType()
export class UpdateCouponInput {
  @Field(() => Float, { nullable: true })
  discountValue?: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field(() => Float, { nullable: true })
  minOrderValue?: number;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @Field({ nullable: true })
  validFrom?: Date;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field({ nullable: true })
  isActive?: boolean;
}
