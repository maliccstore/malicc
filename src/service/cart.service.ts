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

@Service()
export class CartService {
  // Get or create cart for session - returns CartData
  async getOrCreateCart(sessionId: string, userId?: number): Promise<CartData> {
    console.log(
      "📦 getOrCreateCart called for",
      userId ? `user ${userId}` : "guest",
      { sessionId }
    );

    let cart = await Cart.findOne({ where: { sessionId } });

    if (!cart) {
      console.log("🆕 Creating new cart");
      cart = await Cart.create({
        sessionId,
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date(),
      });
    } else {
      console.log(
        `✅ Found existing cart (ID: ${cart.id}) with ${cart.totalItems} items`,
        { items: cart.items }
      );
    }

    return this.mapToCartData(cart);
  }

  // PRIVATE method to get Cart model instance (creates if doesn't exist)
  private async getCartModel(
    sessionId: string,
    userId?: number
  ): Promise<Cart> {
    let cart = await Cart.findOne({ where: { sessionId } });

    if (!cart) {
      console.log(
        "🆕 Creating new cart in getCartModel for session:",
        sessionId
      );
      cart = await Cart.create({
        sessionId,
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        lastUpdated: new Date(),
      });
    }

    return cart;
  }

  // Add item to cart - CORRECTED VERSION
  private async getProductDetails(
    productId: string,
    quantity: number = 1
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
    const inStock = await product.checkStock(quantity);
    const availableQuantity = await product.getAvailableQuantity();

    if (!inStock) {
      throw new Error(
        `Product ${product.name} is out of stock. Available: ${availableQuantity}`
      );
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

    // Ensure items is always an array
    const currentItems = Array.isArray(cartModel.items)
      ? [...cartModel.items]
      : [];

    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === input.productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      currentItems[existingItemIndex].quantity += input.quantity;
      currentItems[existingItemIndex].updatedAt = new Date();
      currentItems[existingItemIndex].price = productDetails.price;

      console.log(
        `🔄 Updated existing item: ${productDetails.name}, new quantity: ${currentItems[existingItemIndex].quantity}`
      );
    } else {
      // Add new item with product details from database
      const newItem: CartItem = {
        productId: input.productId,
        quantity: input.quantity,
        price: productDetails.price,
        name: productDetails.name,
        image: productDetails.image,
        addedAt: new Date(),
        updatedAt: new Date(),
      };
      currentItems.push(newItem);

      console.log(
        `✅ Added new item: ${productDetails.name}, quantity: ${input.quantity}`
      );
    }

    // Recalculate totals
    const totalItems = currentItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const totalAmount = currentItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Update the cart model
    cartModel.items = currentItems;
    cartModel.totalItems = totalItems;
    cartModel.totalAmount = totalAmount;
    cartModel.lastUpdated = new Date();

    await cartModel.save();

    return this.mapToCartData(cartModel);
  }

  // Update cart item quantity with inventory adjustment
  async updateCartItem(
    sessionId: string,
    input: UpdateCartItemInput
  ): Promise<CartData> {
    // Validate quantity
    if (input.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    const cartModel = await this.getCartModel(sessionId);
    const currentItems = Array.isArray(cartModel.items)
      ? [...cartModel.items]
      : [];

    const itemIndex = currentItems.findIndex(
      (item) => item.productId === input.productId
    );

    if (itemIndex >= 0) {
      const currentItem = currentItems[itemIndex];
      const quantityDifference = input.quantity - currentItem.quantity;

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
            `✅ Reserved ${quantityDifference} more items for ${currentItem.name}`
          );
        } else if (quantityDifference < 0) {
          // Decreasing quantity - release items
          await inventory.release(Math.abs(quantityDifference));
          console.log(
            `🔄 Released ${Math.abs(quantityDifference)} items for ${
              currentItem.name
            }`
          );
        }
      }

      if (input.quantity === 0) {
        // Remove item if quantity is 0
        const removedItem = currentItems[itemIndex];
        currentItems.splice(itemIndex, 1);
        console.log(`🗑️ Removed item: ${removedItem.name}`);
      } else {
        // Update quantity and refresh product details
        const productDetails = await this.getProductDetails(input.productId);
        currentItems[itemIndex].quantity = input.quantity;
        currentItems[itemIndex].price = productDetails.price;
        currentItems[itemIndex].updatedAt = new Date();
        console.log(
          `✏️ Updated item: ${productDetails.name}, new quantity: ${input.quantity}`
        );
      }

      // Recalculate totals
      const totalItems = currentItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const totalAmount = currentItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      // Update the model
      cartModel.items = currentItems;
      cartModel.totalItems = totalItems;
      cartModel.totalAmount = totalAmount;
      cartModel.lastUpdated = new Date();

      await cartModel.save();
    } else {
      throw new Error(`Product ${input.productId} not found in cart`);
    }

    return this.mapToCartData(cartModel);
  }

  // Remove item from cart with inventory release
  async removeFromCart(
    sessionId: string,
    productId: string
  ): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId);
    const currentItems = Array.isArray(cartModel.items)
      ? [...cartModel.items]
      : [];

    const itemIndex = currentItems.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex >= 0) {
      const removedItem = currentItems[itemIndex];

      // Release reserved items from inventory
      const inventory = await Inventory.findOne({ where: { productId } });
      if (inventory) {
        await inventory.release(removedItem.quantity);
        console.log(
          `🔄 Released ${removedItem.quantity} reserved items for ${removedItem.name}`
        );
      }

      // Remove from cart
      currentItems.splice(itemIndex, 1);
      console.log(`🗑️ Removed item from cart: ${removedItem.name}`);

      // Recalculate totals
      const totalItems = currentItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const totalAmount = currentItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      // Update the model
      cartModel.items = currentItems;
      cartModel.totalItems = totalItems;
      cartModel.totalAmount = totalAmount;
      cartModel.lastUpdated = new Date();

      await cartModel.save();
    }

    return this.mapToCartData(cartModel);
  }

  // Clear entire cart with inventory release
  async clearCart(sessionId: string): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId);

    console.log(
      `🧹 Clearing entire cart (ID: ${cartModel.id}) with ${cartModel.items.length} items`
    );

    // Release all reserved items from inventory
    for (const item of cartModel.items) {
      const inventory = await Inventory.findOne({
        where: { productId: item.productId },
      });
      if (inventory) {
        await inventory.release(item.quantity);
        console.log(
          `🔄 Released ${item.quantity} reserved items for ${item.name}`
        );
      }
    }

    cartModel.items = [];
    cartModel.totalAmount = 0;
    cartModel.totalItems = 0;
    cartModel.lastUpdated = new Date();

    await cartModel.save();

    return this.mapToCartData(cartModel);
  }

  // Refresh cart prices (useful before checkout) - CORRECTED VERSION
  async refreshCartPrices(sessionId: string): Promise<CartData> {
    const cartModel = await this.getCartModel(sessionId);
    const currentItems = Array.isArray(cartModel.items)
      ? [...cartModel.items]
      : [];

    // If cart is empty, just return it
    if (currentItems.length === 0) {
      console.log("🛒 Cart is empty, no prices to refresh");
      return this.mapToCartData(cartModel);
    }

    let needsUpdate = false;
    let updatedItems = 0;
    let removedItems = 0;

    // Refresh prices for all items
    for (let i = currentItems.length - 1; i >= 0; i--) {
      const item = currentItems[i];
      try {
        const productDetails = await this.getProductDetails(item.productId);

        // Check if price changed
        if (item.price !== productDetails.price) {
          item.price = productDetails.price;
          item.updatedAt = new Date();
          needsUpdate = true;
          updatedItems++;
          console.log(`🔄 Updated price for ${item.name}: ${item.price}`);
        }
      } catch (error) {
        // If product is no longer available, remove it from cart
        console.warn(
          `❌ Product ${item.productId} no longer available, removing from cart`
        );
        currentItems.splice(i, 1);
        needsUpdate = true;
        removedItems++;
      }
    }

    if (needsUpdate) {
      console.log(
        `📊 Price refresh: ${updatedItems} items updated, ${removedItems} items removed`
      );

      // Recalculate totals
      const totalItems = currentItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const totalAmount = currentItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      cartModel.items = currentItems;
      cartModel.totalItems = totalItems;
      cartModel.totalAmount = totalAmount;
      cartModel.lastUpdated = new Date();

      await cartModel.save();
    } else {
      console.log("✅ All cart prices are up to date");
    }

    return this.mapToCartData(cartModel);
  }

  // Get cart by session ID
  async getCart(sessionId: string): Promise<CartData | null> {
    const cart = await Cart.findOne({
      where: { sessionId },
    });

    if (cart) {
      console.log(
        `📥 Retrieved cart (ID: ${cart.id}) with ${cart.items.length} items`
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
    });

    if (cart) {
      console.log(
        `📥 Retrieved cart (ID: ${cart.id}) for user ${userId} with ${cart.items.length} items`
      );
    }

    return cart ? this.mapToCartData(cart) : null;
  }

  // Merge guest cart with user cart (when user logs in) - CORRECTED VERSION
  async mergeCarts(guestSessionId: string, userId: string): Promise<CartData> {
    console.log(
      `🔄 Merging guest cart (${guestSessionId}) with user cart (${userId})`
    );

    const guestCart = await this.getCart(guestSessionId);
    const userCart = await this.getCartByUserId(userId);

    if (!guestCart || guestCart.items.length === 0) {
      console.log("📭 Guest cart is empty, returning user cart");
      return (
        userCart ||
        (await this.getOrCreateCart(guestSessionId, parseInt(userId)))
      );
    }

    if (!userCart || userCart.items.length === 0) {
      // Simply assign the user ID to the guest cart
      console.log("📭 User cart is empty, assigning user ID to guest cart");
      const guestCartModel = await Cart.findByPk(guestCart.id);
      if (guestCartModel) {
        guestCartModel.userId = parseInt(userId);
        await guestCartModel.save();
        return this.mapToCartData(guestCartModel);
      }
    }

    // Both carts have items - merge them
    console.log(
      `🔄 Merging ${guestCart.items.length} guest items with ${
        userCart!.items.length
      } user items`
    );

    // Start with user cart items
    const mergedItems = [...userCart!.items];
    let mergedCount = 0;
    let updatedCount = 0;

    for (const guestItem of guestCart.items) {
      const existingItemIndex = mergedItems.findIndex(
        (item) => item.productId === guestItem.productId
      );

      if (existingItemIndex >= 0) {
        // Combine quantities and use current price from database
        const productDetails = await this.getProductDetails(
          guestItem.productId
        );
        mergedItems[existingItemIndex].quantity += guestItem.quantity;
        mergedItems[existingItemIndex].price = productDetails.price; // Use current price
        mergedItems[existingItemIndex].updatedAt = new Date();
        updatedCount++;
      } else {
        // Add new item with refreshed product details
        const productDetails = await this.getProductDetails(
          guestItem.productId
        );
        mergedItems.push({
          ...guestItem,
          price: productDetails.price, // Use current price
          name: productDetails.name,
          image: productDetails.image,
          updatedAt: new Date(),
        });
        mergedCount++;
      }
    }

    console.log(
      `✅ Merge complete: ${mergedCount} new items, ${updatedCount} updated items`
    );

    // Update user cart with merged items
    const userCartModel = await Cart.findByPk(userCart!.id);
    if (userCartModel) {
      const totalItems = mergedItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const totalAmount = mergedItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      userCartModel.items = mergedItems;
      userCartModel.totalItems = totalItems;
      userCartModel.totalAmount = totalAmount;
      userCartModel.lastUpdated = new Date();
      await userCartModel.save();

      // Delete guest cart
      await Cart.destroy({
        where: { sessionId: guestSessionId },
      });

      console.log(`✅ Cart merge completed successfully`);
      return this.mapToCartData(userCartModel);
    }

    throw new Error("Failed to merge carts");
  }

  // Transfer cart to user (when user logs in) - SIMPLIFIED VERSION
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

    return this.mapToCartData(cartModel);
  }

  // Helper to map Sequelize model to CartData interface
  private mapToCartData(cart: Cart): CartData {
    const items = cart.items || [];
    const totalAmount = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    // Ensure database values match calculated values
    if (Math.abs(cart.totalAmount - totalAmount) > 0.01) {
      console.warn(
        `💰 Cart total amount mismatch: DB=${cart.totalAmount}, Calculated=${totalAmount}`
      );
    }
    if (cart.totalItems !== totalItems) {
      console.warn(
        `🛒 Cart total items mismatch: DB=${cart.totalItems}, Calculated=${totalItems}`
      );
    }

    return {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      items: items,
      totalAmount: totalAmount, // Use calculated total for accuracy
      totalItems: totalItems, // Use calculated total for accuracy
      lastUpdated: cart.lastUpdated,
    };
  }
}
