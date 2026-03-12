import {
    Query,
    Resolver,
    Arg,
    Mutation,
    Authorized,
    Ctx,
    ID,
} from "type-graphql";
import { Service } from "typedi";

import { Review, ProductRatingSummary } from "../schemas/review.schema";
import {
    CreateReviewInput,
    UpdateReviewInput,
} from "../inputs/review.inputs";

import ReviewService from "../../../service/review.service";
import { UserToken } from "../../../types/user";
import { UserRole } from "../../../enums/UserRole";

@Service()
@Resolver()
export class ReviewResolver {
    constructor(private readonly reviewService: ReviewService) { }

    /* Queries */

    @Query(() => [Review])
    async productReviews(@Arg("productId", () => ID) productId: string) {
        return await this.reviewService.getProductReviews(productId);
    }

    @Query(() => ProductRatingSummary)
    async productRatingSummary(@Arg("productId", () => ID) productId: string) {
        return await this.reviewService.getProductRatingSummary(productId);
    }

    /* Mutations */

    @Authorized(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPERADMIN)
    @Mutation(() => Review)
    async createReview(
        @Ctx() { user }: { user: UserToken },
        @Arg("input") input: CreateReviewInput,
    ) {
        if (!user) throw new Error("Not authenticated");

        return await this.reviewService.createReview(user.id, input);
    }

    @Authorized(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPERADMIN)
    @Mutation(() => Review)
    async updateReview(
        @Ctx() { user }: { user: UserToken },
        @Arg("id", () => ID) id: string,
        @Arg("input") input: UpdateReviewInput,
    ) {
        if (!user) throw new Error("Not authenticated");

        return await this.reviewService.updateReview(id, user.id, input);
    }

    @Authorized(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPERADMIN)
    @Mutation(() => Boolean)
    async deleteReview(
        @Ctx() { user }: { user: UserToken },
        @Arg("id", () => ID) id: string,
    ) {
        if (!user) throw new Error("Not authenticated");

        await this.reviewService.deleteReview(id, user.id);
        return true;
    }

    /* Admin Mutations */

    @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Mutation(() => Review)
    async approveReview(
        @Ctx() { user }: { user: UserToken },
        @Arg("id", () => ID) id: string,
    ) {
        if (!user) throw new Error("Not authenticated");
        return await this.reviewService.adminApproveReview(id);
    }

    @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
    @Mutation(() => Review)
    async rejectReview(
        @Ctx() { user }: { user: UserToken },
        @Arg("id", () => ID) id: string,
    ) {
        if (!user) throw new Error("Not authenticated");
        return await this.reviewService.adminRejectReview(id);
    }
}