import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  InputType,
  Field,
} from "type-graphql";
import { Service } from "typedi";
import { CartService } from "../../../service/cart.service";
import { GraphQLContext } from "../../graphql/context";
import { CartType } from "../../../types/cart.types";

@InputType()
export class AddToCartInput {
  @Field()
  productId!: string;

  @Field()
  quantity!: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field()
  productId!: string;

  @Field()
  quantity!: number;
}

@Service()
@Resolver()
export class CartResolver {
  constructor(private cartService: CartService) { }

  @Query(() => CartType, { nullable: true })
  async getCart(@Ctx() ctx: GraphQLContext): Promise<CartType | null> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    // Refresh prices before returning cart
    const freshCart = await this.cartService.refreshCartPrices(
      ctx.session.sessionId,
      userId
    );

    console.log("🛒 Fresh cart data:", {
      cartId: freshCart.id,
      items: freshCart.items,
      totalItems: freshCart.totalItems,
      userId
    });

    return this.mapCartDataToCartType(freshCart);
  }

  @Mutation(() => CartType)
  async addToCart(
    @Arg("input") input: AddToCartInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartType> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    const cart = await this.cartService.addToCart(
      ctx.session.sessionId,
      input,
      userId
    );

    console.log("✅ Added to cart:", {
      cartId: cart.id,
      productId: input.productId,
      quantity: input.quantity,
      itemsCount: cart.items.length,
      totalItems: cart.totalItems,
      userId
    });

    return this.mapCartDataToCartType(cart);
  }

  @Mutation(() => CartType)
  async updateCartItem(
    @Arg("input") input: UpdateCartItemInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartType> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    const cart = await this.cartService.updateCartItem(
      ctx.session.sessionId,
      input,
      userId
    );
    return this.mapCartDataToCartType(cart);
  }

  @Mutation(() => CartType)
  async removeFromCart(
    @Arg("productId") productId: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartType> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    const cart = await this.cartService.removeFromCart(
      ctx.session.sessionId,
      productId,
      userId
    );
    return this.mapCartDataToCartType(cart);
  }

  @Mutation(() => CartType)
  async clearCart(@Ctx() ctx: GraphQLContext): Promise<CartType> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    const cart = await this.cartService.clearCart(
      ctx.session.sessionId,
      userId
    );
    return this.mapCartDataToCartType(cart);
  }

  @Mutation(() => CartType)
  async refreshCart(@Ctx() ctx: GraphQLContext): Promise<CartType> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    const userId = ctx.user ? parseInt(ctx.user.id) : undefined;

    // Force refresh of all cart prices
    const cart = await this.cartService.refreshCartPrices(
      ctx.session.sessionId,
      userId
    );
    return this.mapCartDataToCartType(cart);
  }

  private mapCartDataToCartType(cartData: any): CartType {
    const items = cartData.items || [];
    const actualTotalItems = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );

    // Log any inconsistencies
    if (cartData.totalItems !== actualTotalItems) {
      console.warn("🔄 Correcting cart totals:", {
        cartId: cartData.id,
        reported: cartData.totalItems,
        actual: actualTotalItems,
      });
    }

    return {
      id: cartData.id,
      sessionId: cartData.sessionId,
      userId: cartData.userId,
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
      })),
      totalAmount: cartData.totalAmount,
      totalItems: actualTotalItems, // Always use calculated total
      lastUpdated: cartData.lastUpdated,
    };
  }
}
