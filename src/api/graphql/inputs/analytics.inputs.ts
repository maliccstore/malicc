import { InputType, Field } from "type-graphql";
import { GraphQLJSONObject } from "graphql-scalars";

@InputType()
export class TrackEventInput {
  @Field()
  eventType!: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  sessionId?: string;
}
