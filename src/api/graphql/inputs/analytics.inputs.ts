import { InputType, Field } from "type-graphql";
import { GraphQLJSONObject } from "graphql-scalars";

@InputType()
export class TrackEventInput {
  @Field()
  event!: string; // changed from eventType

  @Field()
  sessionId!: string; // now required

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, any>;

  // optional (good to keep for future)
  @Field({ nullable: true })
  userId?: string;
}
