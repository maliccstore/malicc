import { InputType, Field, ID, Int } from "type-graphql";

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