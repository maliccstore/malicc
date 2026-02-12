import { Service } from "typedi";
import { Cart } from "../models/Cart";
import { Product } from "../models/ProductModel";
import {
  CartData,
  CartItem,
  AddToCartInput,
  UpdateCartItemInput,
} from "../interface/cart";
import { Inventory } from "../models/Inventory";
import { CartItem as CartItemModel } from "../models/CartItem";

@Service()
export class CartService {
  // Get or create cart for session - returns CartData
  async getOrCreateCart(sessionId: string, userId?: number): Promise<CartData> {
    console.log(
      "📦 getOrCreateCart called for",
      userId ? `user ${userId}` : "guest",
      { sessionId }
    );

    let cart = await Cart.findOne({
      where: { sessionId },
      include: [{ model: CartItemModel, include: [Product] }],
    });

    if (!cart) {
      console.log("🆕 Creating new cart");
      cart = await Cart.create({
        sessionId,
        userId,
        // items will be empty by default
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date(),
      });
      // Re-fetch to ensure relations are loaded (empty array)
      cart = await Cart.findOne({
        where: { id: cart.id },
        include: [{ model: CartItemModel, include: [Product] }],
      });
    } else {
      console.log(
        `✅ Found existing cart (ID: ${cart.id}) with ${cart.items?.length || 0} items`
      );
    }

    return this.mapToCartData(cart!);
  }

  // PRIVATE method to get Cart model instance (creates if doesn't exist)
  private async getCartModel(
    sessionId: string,
    userId?: number
  ): Promise<Cart> {
    let cart = await Cart.findOne({
      where: { sessionId },
      include: [{ model: CartItemModel, include: [Product] }],
    });

    if (!cart) {
      console.log(
        "🆕 Creating new cart in getCartModel for session:",
        sessionId
      );
      cart = await Cart.create({
        sessionId,
        userId,
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date(),
      });
      // Re-fetch
      cart = await Cart.findOne({
        where: { id: cart.id },
        include: [{ model: CartItemModel, include: [Product] }],
      });
    } else if (userId && !cart.userId) {
      // Sync userId if missing
      console.log(`🔄 Syncing userId ${userId} to cart ${cart.id}`);
      cart.userId = userId;
      await cart.save();
    }

    return cart!;
  }

  // Get product details helper
  private async getProductDetails(
    productId: string,
    quantity: number = 1,
    checkStock: boolean = true
  ): Promise<{
    price: number;
    name: string;
    image?: string;
    inStock: boolean;
    availableQuantity: number;
  }> {
    const product = await Product.findByPk(productId, {
      include: [Inventory],
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (!product.isActive) {
      throw new Error(`Product ${productId} is not available`);
    }

    // Check inventory
    const availableQuantity = await product.getAvailableQuantity();
    let inStock = true;

    if (checkStock) {
      inStock = await product.checkStock(quantity);
      if (!inStock) {
        throw new Error(
          `Product ${product.name} is out of stock. Available: ${availableQuantity}`
        );
      }
    }

    return {
      price: product.price,
      name: product.name,
      image:
        product.imageUrl && product.imageUrl.length > 0
          ? product.imageUrl[0]
          : undefined,
      inStock,
      availableQuantity,
    };
  }

  // Add item to cart with inventory reservation
  async addToCart(
    sessionId: string,
    input: AddToCartInput,
    userId?: number
  ): Promise<CartData> {
    // Validate quantity
    if (input.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Fetch product details with inventory check
    const productDetails = await this.getProductDetails(
      input.productId,
      input.quantity
    );

    // Get or create cart
    const cartModel = await this.getCartModel(sessionId, userId);

    // Reserve items in inventory
    const inventory = await Inventory.findOne({
      where: { productId: input.productId },
    });
    if (inventory && !(await inventory.reserve(input.quantity))) {
      throw new Error(
        `Failed to reserve ${input.quantity} items for ${productDetails.name}`
      );
    }

    console.log(
      `✅ Reserved ${input.quantity} items for ${productDetails.name}`
    );

    // Check if item exists in cart
    const existingItem = await CartItemModel.findOne({
      where: {
        cartId: cartModel.id,
        productId: input.productId
      }
    });

    if (existingItem) {
      // Update existing item
      existingItem.quantity += input.quantity;
      existingItem.unitPrice = productDetails.price;
      existingItem.calculateTotals(); // helper method in model
      await existingItem.save();

      console.log(
        `🔄 Updated existing item: ${productDetails.name}, new quantity: ${existingItem.quantity}`
      );
    } else {
      // Create new item
      await CartItemModel.create({
        cartId: cartModel.id,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: productDetails.price,
        totalPrice: productDetails.price * input.quantity,
      });

      console.log(
        `✅ Added new item: ${productDetails.name}, quantity: ${input.quantity}`
      );
    }

    // Update cart timestamp
    cartModel.lastUpdated = new Date();
    await cartModel.save();

    // Reload cart details to update totals and return full data
    // Assuming Cart model has a method or we can just fetch
    await cartModel.reload({
      include: [{ model: CartItemModel, include: [Product] }]
    });

    // Explicitly recalc totals if model hooks don't handle it
    await cartModel.recalcTotals();

    return this.mapToCartData(cartModel);
  }

  // Update cart item quantity with inventory adjustment
  async updateCartItem(
    sessionId: string,
    input: UpdateCartItemInput,
    userId?: number
  ): Promise<CartData> {
    // Validate quantity
    if (input.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    const cartModel = await this.getCartModel(sessionId, userId);

    // Find the item
    const cartItem = await CartItemModel.findOne({
      where: {
        cartId: cartModel.id,
        productId: input.productId
      },
      include: [Product]
    });

    if (cartItem) {
      const quantityDifference = input.quantity - cartItem.quantity;

      // Handle inventory reservation/release
      const inventory = await Inventory.findOne({
        where: { productId: input.productId },
      });

      if (inventory) {
        if (quantityDifference > 0) {
          // Increasing quantity - reserve more items
          if (!(await inventory.reserve(quantityDifference))) {
            const available = inventory.availableQuantity;
            throw new Error(
              `Cannot add ${quantityDifference} more items. Only ${available} available.`
            );
          }
          console.log(
            `✅ Reserved ${quantityDifference} more items for ${cartItem.product?.name || input.productId}`
          );
        } else if (quantityDifference < 0) {
          // Decreasing quantity - release items
          await inventory.release(Math.abs(quantityDifference));
          console.log(
            `🔄 Released ${Math.abs(quantityDifference)} items for ${cartItem.product?.name || input.productId
            }`
          );
        }
      }

      if (input.quantity === 0) {
        // Remove item if quantity is 0
        await cartItem.destroy();
        console.log(`🗑️ Removed item: ${cartItem.product?.name || input.productId}`);
      } else {
        // Update quantity and refresh product details
        const productDetails = await this.getProductDetails(input.productId, 1, false); // just checking price/existence

        cartItem.quantity = input.quantity;
        cartItem.unitPrice = productDetails.price;
        cartItem.calculateTotals();
        await cartItem.save();

        console.log(
          `✏️ Updated item: ${productDetails.name}, new quantity: ${input.quantity}`
        );
      }

      // Update cart timestamp and recalculate
      cartModel.lastUpdated = new Date();
      await cartModel.save();
      await cartModel.reload({
        include: [{ model: CartItemModel, include: [Product] }]
      });
      await cartModel.recalcTotals();

    } else {
      throw new Error(`Product ${input.productId} not found in cart`);
    }

    return this.mapToCartData(cartModel);
  }

  // Remove item from cart with inventory release
  async removeFromCart(
    sessionId: string,
    productId: string,
    userId?: number
  ): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId, userId);

    const cartItem = await CartItemModel.findOne({
      where: {
        cartId: cartModel.id,
        productId: productId
      }
    });

    if (cartItem) {
      // Release reserved items from inventory
      const inventory = await Inventory.findOne({ where: { productId } });
      if (inventory) {
        await inventory.release(cartItem.quantity);
        console.log(
          `🔄 Released ${cartItem.quantity} reserved items for product ${productId}`
        );
      }

      // Remove from cart
      await cartItem.destroy();
      console.log(`🗑️ Removed item from cart: ${productId}`);

      // Update cart
      cartModel.lastUpdated = new Date();
      await cartModel.save();
      await cartModel.reload({
        include: [{ model: CartItemModel, include: [Product] }]
      });
      await cartModel.recalcTotals();
    }

    return this.mapToCartData(cartModel);
  }

  // Clear entire cart with inventory release
  async clearCart(
    sessionId: string,
    userId?: number
  ): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId, userId);

    console.log(
      `🧹 Clearing entire cart (ID: ${cartModel.id})`
    );

    // We need to iterate to release inventory
    // (Optimization: could do bulk inventory update if architecture allowed, but simplistic here)
    const items = cartModel.items || [];

    // Release all reserved items from inventory
    for (const item of items) {
      const inventory = await Inventory.findOne({
        where: { productId: item.productId },
      });
      if (inventory) {
        await inventory.release(item.quantity);
        console.log(
          `🔄 Released ${item.quantity} reserved items for product ${item.productId}`
        );
      }
    }

    // Delete all items
    await CartItemModel.destroy({
      where: { cartId: cartModel.id }
    });

    cartModel.totalAmount = 0;
    cartModel.totalItems = 0;
    cartModel.lastUpdated = new Date();

    await cartModel.save();

    // return empty cart structure
    return this.mapToCartData(cartModel);
  }

  // Refresh cart prices (useful before checkout)
  async refreshCartPrices(
    sessionId: string,
    userId?: number
  ): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId, userId);

    // Ensure items are loaded
    if (!cartModel.items) {
      await cartModel.reload({
        include: [{ model: CartItemModel, include: [Product] }]
      });
    }

    const items = cartModel.items || [];

    // If cart is empty, just return it
    if (items.length === 0) {
      console.log("🛒 Cart is empty, no prices to refresh");
      return this.mapToCartData(cartModel);
    }

    let needsUpdate = false;
    let updatedItems = 0;
    let removedItems = 0;

    // Refresh prices for all items
    for (const item of items) {
      try {
        // Check if price changed
        const productDetails = await this.getProductDetails(item.productId, 1, false);

        if (Number(item.unitPrice) !== productDetails.price) {
          item.unitPrice = productDetails.price;
          item.calculateTotals();
          await item.save();

          needsUpdate = true;
          updatedItems++;
          console.log(`🔄 Updated price for product ${item.productId}: ${item.unitPrice}`);
        }
      } catch (error) {
        // If product is no longer available, remove it from cart
        console.warn(
          `❌ Product ${item.productId} no longer available, removing from cart`
        );
        await item.destroy();
        needsUpdate = true;
        removedItems++;
      }
    }

    if (needsUpdate) {
      console.log(
        `📊 Price refresh: ${updatedItems} items updated, ${removedItems} items removed`
      );

      await cartModel.reload({
        include: [{ model: CartItemModel, include: [Product] }]
      });
      await cartModel.recalcTotals();
    } else {
      console.log("✅ All cart prices are up to date");
    }

    return this.mapToCartData(cartModel);
  }

  // Get cart by session ID
  async getCart(sessionId: string): Promise<CartData | null> {
    const cart = await Cart.findOne({
      where: { sessionId },
      include: [{ model: CartItemModel, include: [Product] }],
    });

    if (cart) {
      console.log(
        `📥 Retrieved cart (ID: ${cart.id}) with ${cart.items?.length || 0} items`
      );
    } else {
      console.log(`📥 No cart found for session: ${sessionId}`);
    }

    return cart ? this.mapToCartData(cart) : null;
  }

  // Get cart by user ID (for logged-in users)
  async getCartByUserId(userId: string): Promise<CartData | null> {
    const cart = await Cart.findOne({
      where: { userId: parseInt(userId) },
      include: [{ model: CartItemModel, include: [Product] }],
    });

    if (cart) {
      console.log(
        `📥 Retrieved cart (ID: ${cart.id}) for user ${userId} with ${cart.items?.length || 0} items`
      );
    }

    return cart ? this.mapToCartData(cart) : null;
  }

  // Merge guest cart with user cart (when user logs in)
  async mergeCarts(guestSessionId: string, userId: string): Promise<CartData> {
    console.log(
      `🔄 Merging guest cart (${guestSessionId}) with user cart (${userId})`
    );

    const guestCart = await this.getCart(guestSessionId); // returns mapped data, but we need models really
    // Let's fetch models directly
    const guestCartModel = await Cart.findOne({
      where: { sessionId: guestSessionId },
      include: [{ model: CartItemModel }]
    });

    const userCartModel = await Cart.findOne({
      where: { userId: parseInt(userId) },
      include: [{ model: CartItemModel }]
    });

    if (!guestCartModel || !guestCartModel.items || guestCartModel.items.length === 0) {
      console.log("📭 Guest cart is empty, returning user cart");
      return (
        (userCartModel ? this.mapToCartData(userCartModel) : await this.getOrCreateCart(guestSessionId, parseInt(userId)))
      );
    }

    if (!userCartModel) {
      // If no user cart, just adopt the guest cart
      console.log("📭 No user cart, assigning user ID to guest cart");
      guestCartModel.userId = parseInt(userId);
      await guestCartModel.save();
      return this.mapToCartData(guestCartModel);
    }

    // Both carts have items - merge them
    console.log(
      `🔄 Merging ${guestCartModel.items.length} guest items into user cart`
    );

    let mergedCount = 0;
    let updatedCount = 0;

    for (const guestItem of guestCartModel.items) {
      const existingItem = await CartItemModel.findOne({
        where: {
          cartId: userCartModel.id,
          productId: guestItem.productId
        }
      });

      const productDetails = await this.getProductDetails(guestItem.productId, 1, false);

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
        existingItem.unitPrice = productDetails.price;
        existingItem.calculateTotals();
        await existingItem.save();
        updatedCount++;
      } else {
        await CartItemModel.create({
          cartId: userCartModel.id,
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          unitPrice: productDetails.price,
          totalPrice: productDetails.price * guestItem.quantity
        });
        mergedCount++;
      }
    }

    console.log(
      `✅ Merge complete: ${mergedCount} new items, ${updatedCount} updated items`
    );

    // Delete guest cart (items will be deleted by ON DELETE CASCADE usually, or we clean up)
    await CartItemModel.destroy({ where: { cartId: guestCartModel.id } });
    await guestCartModel.destroy();

    // Reload user cart
    await userCartModel.reload({
      include: [{ model: CartItemModel, include: [Product] }]
    });
    await userCartModel.recalcTotals();

    console.log(`✅ Cart merge completed successfully`);
    return this.mapToCartData(userCartModel);
  }

  // Transfer cart to user
  async transferCartToUser(
    sessionId: string,
    userId: string
  ): Promise<CartData> {
    console.log(
      `🔄 Transferring cart from session ${sessionId} to user ${userId}`
    );

    const cartModel = await Cart.findOne({ where: { sessionId } });

    if (!cartModel) {
      console.log("📭 No cart found for session, creating new one for user");
      return await this.getOrCreateCart(sessionId, parseInt(userId));
    }

    // Check if user already has a cart
    const existingUserCart = await Cart.findOne({
      where: { userId: parseInt(userId) },
    });

    if (existingUserCart) {
      console.log("🔄 User already has a cart, merging carts");
      return await this.mergeCarts(sessionId, userId);
    }

    // Simply assign the user ID to the current cart
    console.log("✅ Assigning user ID to existing cart");
    cartModel.userId = parseInt(userId);
    await cartModel.save();

    // Reload and return
    await cartModel.reload({
      include: [{ model: CartItemModel, include: [Product] }]
    });

    return this.mapToCartData(cartModel);
  }

  // Helper to map Sequelize model to CartData interface
  private mapToCartData(cart: Cart): CartData {
    const items = cart.items || [];

    // Map items to interface
    const mappedItems: CartItem[] = items.map(item => {
      // Handle possible missing product (shouldn't happen with include, but separate handling if product deleted)
      const productName = item.product ? item.product.name : 'Unavailable Product';
      const imageUrl = item.product && item.product.imageUrl && item.product.imageUrl.length > 0
        ? item.product.imageUrl[0]
        : undefined;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        name: productName,
        image: imageUrl,
        addedAt: item.createdAt || new Date(),
        updatedAt: item.updatedAt || new Date()
      };
    });

    // Use values from parent cart, which should be updated by recalcTotals
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      items: mappedItems,
      totalAmount: Number(cart.totalAmount),
      totalItems: cart.totalItems,
      lastUpdated: cart.lastUpdated,
    };
  }
}
