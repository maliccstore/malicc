import { Service } from "typedi";
import { Cart } from "../models/Cart";
import { Session } from "../models/Session";
import {
  CartData,
  CartItem,
  AddToCartInput,
  UpdateCartItemInput,
} from "../interface/cart";

@Service()
export class CartService {
  // Get or create cart for session
  async getOrCreateCart(sessionId: string, userId?: string): Promise<CartData> {
    let cart = await Cart.findOne({
      where: { sessionId },
    });

    if (!cart) {
      cart = await Cart.create({
        sessionId,
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date(),
      });
    }

    return this.mapToCartData(cart);
  }

  // Get cart by session ID
  async getCart(sessionId: string): Promise<CartData | null> {
    const cart = await Cart.findOne({
      where: { sessionId },
    });

    return cart ? this.mapToCartData(cart) : null;
  }

  // Get cart by user ID (for logged-in users)
  async getCartByUserId(userId: string): Promise<CartData | null> {
    const cart = await Cart.findOne({
      where: { userId },
    });

    return cart ? this.mapToCartData(cart) : null;
  }

  // Add item to cart
  async addToCart(sessionId: string, input: AddToCartInput): Promise<CartData> {
    const cart = await this.getOrCreateCart(sessionId);
    const cartModel = await Cart.findByPk(cart.id);

    if (!cartModel) {
      throw new Error("Cart not found");
    }

    const existingItemIndex = cartModel.items.findIndex(
      (item) => item.productId === input.productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      cartModel.items[existingItemIndex].quantity += input.quantity;
      cartModel.items[existingItemIndex].updatedAt = new Date();
    } else {
      // Add new item
      const newItem: CartItem = {
        ...input,
        addedAt: new Date(),
        updatedAt: new Date(),
      };
      cartModel.items.push(newItem);
    }

    // Recalculate totals
    cartModel.calculateTotals();
    cartModel.lastUpdated = new Date();
    await cartModel.save();

    return this.mapToCartData(cartModel);
  }

  // Update cart item quantity
  async updateCartItem(
    sessionId: string,
    input: UpdateCartItemInput
  ): Promise<CartData> {
    const cart = await Cart.findOne({
      where: { sessionId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === input.productId
    );

    if (itemIndex >= 0) {
      if (input.quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = input.quantity;
        cart.items[itemIndex].updatedAt = new Date();
      }

      // Recalculate totals
      cart.calculateTotals();
      cart.lastUpdated = new Date();
      await cart.save();
    }

    return this.mapToCartData(cart);
  }

  // Remove item from cart
  async removeFromCart(
    sessionId: string,
    productId: string
  ): Promise<CartData> {
    const cart = await Cart.findOne({
      where: { sessionId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.items = cart.items.filter((item) => item.productId !== productId);

    // Recalculate totals
    cart.calculateTotals();
    cart.lastUpdated = new Date();
    await cart.save();

    return this.mapToCartData(cart);
  }

  // Clear entire cart
  async clearCart(sessionId: string): Promise<CartData> {
    const cart = await Cart.findOne({
      where: { sessionId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    cart.lastUpdated = new Date();
    await cart.save();

    return this.mapToCartData(cart);
  }

  // Merge guest cart with user cart (when user logs in)
  async mergeCarts(guestSessionId: string, userId: string): Promise<CartData> {
    const guestCart = await this.getCart(guestSessionId);
    const userCart = await this.getCartByUserId(userId);

    if (!guestCart || guestCart.items.length === 0) {
      return userCart || (await this.getOrCreateCart(guestSessionId, userId));
    }

    if (!userCart || userCart.items.length === 0) {
      // Simply assign the user ID to the guest cart
      await Cart.update({ userId }, { where: { sessionId: guestSessionId } });
      return this.getCart(guestSessionId) as Promise<CartData>;
    }

    // Merge items from both carts
    const mergedItems = [...userCart.items];

    for (const guestItem of guestCart.items) {
      const existingItemIndex = mergedItems.findIndex(
        (item) => item.productId === guestItem.productId
      );

      if (existingItemIndex >= 0) {
        // Combine quantities
        mergedItems[existingItemIndex].quantity += guestItem.quantity;
        mergedItems[existingItemIndex].updatedAt = new Date();
      } else {
        // Add new item
        mergedItems.push(guestItem);
      }
    }

    // Update user cart with merged items
    const userCartModel = await Cart.findByPk(userCart.id);
    if (userCartModel) {
      userCartModel.items = mergedItems;
      userCartModel.calculateTotals();
      userCartModel.lastUpdated = new Date();
      await userCartModel.save();
    }

    // Delete guest cart
    await Cart.destroy({
      where: { sessionId: guestSessionId },
    });

    return this.mapToCartData(userCartModel!);
  }

  // Helper to map Sequelize model to CartData interface
  private mapToCartData(cart: Cart): CartData {
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      items: cart.items,
      totalAmount: parseFloat(cart.totalAmount.toString()),
      totalItems: cart.totalItems,
      lastUpdated: cart.lastUpdated,
    };
  }
}
