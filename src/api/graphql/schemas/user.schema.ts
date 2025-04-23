// src/api/graphql/schemas/user.schema.ts

import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: number;

  @Field()
  username: string;

  password: string;

  @Field()
  phoneNumber: string;

  isPhoneVerified: boolean;

  @Field()
  otp: string;

  otpExpiration: string;

  @Field()
  email: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string;

  @Field(() => Boolean)
  user!: boolean;
}
@InputType()
export class VerifyOTPInput {
  @Field()
  phoneNumber!: string;

  @Field()
  otp!: string;
}
