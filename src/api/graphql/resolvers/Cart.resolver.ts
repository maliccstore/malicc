import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  InputType,
  Field,
} from "type-graphql";
import { Service } from "typedi";
import { CartService } from "../../../service/cart.service";
import { GraphQLContext } from "../../graphql/context";
import { CartData } from "../../../interface/cart";

@InputType()
class AddToCartInput {
  @Field()
  productId!: string;

  @Field()
  quantity!: number;

  @Field()
  price!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  image?: string;
}

@InputType()
class UpdateCartItemInput {
  @Field()
  productId!: string;

  @Field()
  quantity!: number;
}

@Service()
@Resolver()
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => CartData, { nullable: true })
  async getCart(@Ctx() ctx: GraphQLContext): Promise<CartData | null> {
    if (!ctx.session) {
      throw new Error("No active session");
    }
    return ctx.cart || null;
  }

  @Mutation(() => CartData)
  async addToCart(
    @Arg("input") input: AddToCartInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartData> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    return this.cartService.addToCart(ctx.session.sessionId, input);
  }

  @Mutation(() => CartData)
  async updateCartItem(
    @Arg("input") input: UpdateCartItemInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartData> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    return this.cartService.updateCartItem(ctx.session.sessionId, input);
  }

  @Mutation(() => CartData)
  async removeFromCart(
    @Arg("productId") productId: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<CartData> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    return this.cartService.removeFromCart(ctx.session.sessionId, productId);
  }

  @Mutation(() => CartData)
  async clearCart(@Ctx() ctx: GraphQLContext): Promise<CartData> {
    if (!ctx.session) {
      throw new Error("No active session");
    }

    return this.cartService.clearCart(ctx.session.sessionId);
  }
}
