// src/api/graphql/schemas/user.schema.ts

import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id?: number;

  @Field()
  username: string;

  password: string;

  @Field()
  phoneNumber: string;

  @Field()
  isPhoneVerified: boolean;

  // @Field({ nullable: true })
  otp?: string | null;

  otpExpiration?: Date | null;

  @Field()
  email: string;

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => Date)
  updatedAt?: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string;

  @Field(() => UserProfile)
  user!: UserProfile;
}

@InputType()
export class SignupInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  phoneNumber: string;
}
@InputType()
export class VerifyOTPInput {
  @Field()
  phoneNumber!: string;

  @Field()
  otp!: string;
}

@ObjectType()
export class SignupResponse {
  @Field(() => UserProfile)
  user: UserProfile;
}

@ObjectType()
export class LoginResponse {
  @Field(() => UserProfile)
  user: UserProfile;
}
@InputType()
export class LoginOTPInput {
  @Field()
  phoneNumber: string;
}
