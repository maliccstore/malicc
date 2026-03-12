import { ObjectType, Field, ID, Int, Float, InputType } from "type-graphql";

@ObjectType()
export class Review {
    @Field(() => ID)
    id!: string;

    @Field(() => ID)
    userId!: string;

    @Field(() => ID)
    productId!: string;

    @Field(() => Int)
    rating!: number;

    @Field({ nullable: true })
    reviewText?: string;

    @Field()
    createdAt!: string;
}

@ObjectType()
export class ProductRatingSummary {
    @Field(() => Float, { nullable: true })
    averageRating?: number;

    @Field(() => Int)
    totalReviews!: number;
}

@InputType()
export class CreateReviewInput {
    @Field(() => ID)
    productId!: string;

    @Field(() => ID)
    orderId!: string;

    @Field(() => Int)
    rating!: number;

    @Field({ nullable: true })
    reviewText?: string;
}

@InputType()
export class UpdateReviewInput {
    @Field(() => Int, { nullable: true })
    rating?: number;

    @Field({ nullable: true })
    reviewText?: string;
}