import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class HealthCheck {
  @Field()
  status!: string;

  @Field()
  timestamp!: string;

  @Field()
  uptime!: number;

  @Field()
  message!: string;
}
