import { ObjectType, Field, ID, Int, InputType } from "type-graphql";

@ObjectType()
export class CategorySchema {
    @Field(() => ID)
    id!: string;

    @Field()
    name!: string;

    @Field()
    slug!: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    parentId?: string;

    @Field(() => CategorySchema, { nullable: true })
    parent?: CategorySchema;

    @Field(() => [CategorySchema], { nullable: true })
    children?: CategorySchema[];

    @Field()
    isActive!: boolean;

    @Field(() => Int)
    sortOrder!: number;

    @Field({ nullable: true })
    createdAt?: Date;

    @Field({ nullable: true })
    updatedAt?: Date;
}

@ObjectType()
export class CategoryResponse {
    @Field()
    success!: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field(() => CategorySchema, { nullable: true })
    category?: CategorySchema;
}

@ObjectType()
export class CategoriesResponse {
    @Field()
    success!: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field(() => [CategorySchema])
    categories!: CategorySchema[];

    @Field(() => Int)
    totalCount!: number;
}

@InputType()
export class CreateCategoryInput {
    @Field()
    name!: string;

    @Field()
    slug!: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    parentId?: string;

    @Field({ nullable: true, defaultValue: true })
    isActive?: boolean;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    sortOrder?: number;
}

@InputType()
export class UpdateCategoryInput {
    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    slug?: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    parentId?: string;

    @Field({ nullable: true })
    isActive?: boolean;

    @Field(() => Int, { nullable: true })
    sortOrder?: number;
}

@InputType()
export class CategoryFilterInput {
    @Field({ nullable: true })
    isActive?: boolean;

    @Field({ nullable: true })
    search?: string;

    @Field({ nullable: true })
    parentId?: string;
}
