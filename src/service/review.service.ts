import { Service } from "typedi";
import { Review } from "../models/Review";
import { OrderItem } from "../models/OrderItem";
import { Order } from "../models/Order";
import { CreateReviewInput, UpdateReviewInput } from "../api/graphql/inputs/review.inputs";
import { ReviewStatus } from "@/enums/ReviewStatus";
import { ProductService } from "./product.service";

@Service()
class ReviewService {
  constructor(private readonly productService: ProductService) {}

  /* Create Review */
  async createReview(userId: number, input: CreateReviewInput) {

    const { productId, orderId, rating, reviewText } = input;

    // validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // verify purchase
    const orderItem = await OrderItem.findOne({
      where: {
        productId,
        orderId,
      },
      include: [
        {
          model: Order,
          where: {
            userId,
            status: "COMPLETED",
          },
        },
      ],
    });

    if (!orderItem) {
      throw new Error("User has not purchased this product");
    }

    // prevent duplicate review
    const existingReview = await Review.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      throw new Error("User has already reviewed this product");
    }

    // create review
    const review = await Review.create({
      userId,
      productId,
      orderId,
      rating,
      reviewText,
      status: "pending",
    });

    return review;
  }

  /* Update Review */
  async updateReview(id: string, userId: number, input: UpdateReviewInput) {

    const review = await Review.findByPk(id);

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== userId) {
      throw new Error("Not authorized to update this review");
    }

    if (input.rating && (input.rating < 1 || input.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    await review.update(input);

    return review;
  }

  /* Delete Review */
  async deleteReview(id: string, userId: number) {

    const review = await Review.findByPk(id);

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== userId) {
      throw new Error("Not authorized to delete this review");
    }

    await review.destroy();
  }

  /* Get Product Reviews */
  async getProductReviews(productId: string) {

    return await Review.findAll({
      where: {
        productId,
        status: "approved",
      },
      order: [["createdAt", "DESC"]],
    });
  }

  /* Rating Summary */
  async getProductRatingSummary(productId: string) {

    const reviews = await Review.findAll({
      where: {
        productId,
        status: "approved",
      },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    const totalScore = reviews.reduce((sum, r) => sum + r.rating, 0);

    const averageRating = totalScore / totalReviews;

    return {
      averageRating,
      totalReviews,
    };
  }

  /*Admin Approve Review */
  async adminApproveReview(reviewId: string) {

    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    review.status = ReviewStatus.APPROVED;
    await review.save();
    
    // update product rating
  await this.productService.updateRatingAggregation(review.productId);

    return review;
  }

  /* Admin Reject Review */
  async adminRejectReview(reviewId: string) {

    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    review.status = ReviewStatus.REJECTED;
    await review.save();

    await this.productService.updateRatingAggregation(review.productId);

    return review;
  }

  /* Admin Delete Review */
  async adminDeleteReview(reviewId: string) {

    const review = await Review.findByPk(reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    await review.destroy();

    await this.productService.updateRatingAggregation(review.productId);
    return true;
  }
}

export default ReviewService;