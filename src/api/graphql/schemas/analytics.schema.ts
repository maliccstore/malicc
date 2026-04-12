import { ObjectType, Field, ID, Int } from "type-graphql";
import { GraphQLJSONObject } from "graphql-scalars";

@ObjectType()
export class Event {
  @Field(() => ID)
  id!: string;

  @Field()
  eventType!: string;

  @Field({ nullable: true })
  userId?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, any>;

  @Field({ nullable: true })
  sessionId?: string;

  @Field()
  createdAt!: Date;
}

/**
 * Payload pushed to subscribers whenever an analytics event is ingested.
 * Mirrors the shape returned by RealtimeService.getStats().
 */
@ObjectType()
export class LiveAnalyticsPayload {
  @Field(() => Int)
  activeUsers!: number;

  @Field(() => Int)
  cartsActive!: number;

  @Field(() => Int)
  checkoutActive!: number;

  @Field()
  updatedAt!: Date;
}
