import { InputType, Field, Int } from "type-graphql";
import { OrderStatus } from "../../../enums/OrderStatus";

@InputType()
export class OrderFilterInput {
    @Field(() => OrderStatus, { nullable: true })
    status?: OrderStatus;

    @Field({ nullable: true })
    userId?: number;

    @Field({ nullable: true })
    limit?: number;

    @Field({ nullable: true })
    offset?: number;
}
