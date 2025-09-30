import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class SessionType {
  @Field(() => ID)
  sessionId!: string;

  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field()
  guestId!: string;

  @Field()
  userRole!: string;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field()
  lastAccessed!: Date;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ipAddress?: string;
}
