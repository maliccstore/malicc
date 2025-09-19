// src/api/graphql/schemas/user.schema.ts

import { UserRole } from "../../../enums/UserRole";
import {
  ObjectType,
  Field,
  ID,
  InputType,
  registerEnumType,
} from "type-graphql";

registerEnumType(UserRole, {
  name: "UserRole",
  description: "The role of the user in the system",
});
@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id?: number;

  @Field()
  username: string;

  @Field()
  phoneNumber: string;

  @Field()
  isPhoneVerified: boolean;

  @Field(() => UserRole)
  role: UserRole;

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
