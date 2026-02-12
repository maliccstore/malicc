import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class AddressType {
    @Field(() => ID)
    id: number;

    @Field()
    fullName: string;

    @Field()
    phoneNumber: string;

    @Field()
    addressLine1: string;

    @Field({ nullable: true })
    addressLine2?: string;

    @Field()
    city: string;

    @Field()
    state: string;

    @Field()
    postalCode: string;

    @Field()
    country: string;

    @Field()
    isDefault: boolean;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}

@InputType()
export class CreateAddressInput {
    @Field()
    fullName: string;

    @Field()
    phoneNumber: string;

    @Field()
    addressLine1: string;

    @Field({ nullable: true })
    addressLine2?: string;

    @Field()
    city: string;

    @Field()
    state: string;

    @Field()
    postalCode: string;

    @Field({ defaultValue: "IN" })
    country: string;

    @Field({ defaultValue: false })
    isDefault: boolean;
}

@InputType()
export class UpdateAddressInput {
    @Field({ nullable: true })
    fullName?: string;

    @Field({ nullable: true })
    phoneNumber?: string;

    @Field({ nullable: true })
    addressLine1?: string;

    @Field({ nullable: true })
    addressLine2?: string;

    @Field({ nullable: true })
    city?: string;

    @Field({ nullable: true })
    state?: string;

    @Field({ nullable: true })
    postalCode?: string;

    @Field({ nullable: true })
    country?: string;

    @Field({ nullable: true })
    isDefault?: boolean;
}
