import { Service, Inject } from "typedi";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { Cart } from "../models/Cart";
import { CartItem } from "../models/CartItem";
import { Inventory } from "../models/Inventory";
import Address from "../models/Address";
import { OrderStatus } from "../enums/OrderStatus";
import { Currency } from "../enums/Currency";
import { Product } from "../models/ProductModel";
import { OrderFilterInput } from "../api/graphql/inputs/OrderInput";
import { FindOptions } from "sequelize";
import { FulfillmentStatus } from "../enums/FulfillmentStatus";

@Service()
export class OrderService {
  async createOrderFromCart(
    userId: number,
    addressId: number,
    paymentMethod: string = "COD",
    sessionId?: string,
  ): Promise<Order> {
    // 1. Fetch user's cart and address
    // Priority: Cart with userId, then Cart with sessionId
    let cart = await Cart.findOne({
      where: { userId },
      include: ["items"],
      order: [["updatedAt", "DESC"]],
    });

    // Fallback: Check by session ID if user cart is empty/missing
    if ((!cart || !cart.items || cart.items.length === 0) && sessionId) {
      console.log(
        `⚠️ User ${userId} has no cart, checking session ${sessionId}`,
      );
      const sessionCart = await Cart.findOne({
        where: { sessionId },
        include: ["items"],
        order: [["updatedAt", "DESC"]],
      });

      if (sessionCart && sessionCart.items && sessionCart.items.length > 0) {
        console.log(
          `✅ Found session cart ${sessionCart.id}, linking to user ${userId}`,
        );
        // Link this cart to the user
        sessionCart.userId = userId;
        await sessionCart.save();
        cart = sessionCart;
      }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const address = await Address.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error("Address not found or does not belong to user");
    }

    // 2. Start Transaction
    const transaction = await Order.sequelize!.transaction();

    try {
      // 3. Create Order Snapshot
      const addressSnapshot = address.toJSON();

      const order = await Order.create(
        {
          userId,
          addressId,
          status: OrderStatus.CREATED,
          subtotal: cart.totalAmount, // Assuming cart.totalAmount is correct
          tax: 0, // Placeholder for tax calculation
          shippingFee: 0, // Placeholder for shipping calculation
          totalAmount: cart.totalAmount, // Adjust for tax/shipping
          currency: Currency.INR,
          shippingAddress: addressSnapshot,
          paymentMethod,
          shippingMethod: "STANDARD",
        },
        { transaction },
      );

      // 4. Transform CartItems to OrderItems and handle Inventory
      for (const cartItem of cart.items) {
        const product = await Product.findByPk(cartItem.productId);
        if (!product) {
          throw new Error(`Product ${cartItem.productId} not found`);
        }

        // Verify stock in transaction
        const inventory = await Inventory.findOne({
          where: { productId: cartItem.productId },
          transaction,
        });

        if (!inventory || inventory.availableQuantity < cartItem.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Deduct from inventory (moving from reserved to sold or just decreasing total/onHand)
        // For simplicity, we'll just deduct from total quantity here
        // If your CartService already "reserves", we need to handle that properly.
        // Looking at CartService, it uses inventory.reserve(quantity) which increments reservedQuantity.

        await inventory.update(
          {
            quantity: inventory.quantity - cartItem.quantity,
            reservedQuantity: inventory.reservedQuantity - cartItem.quantity,
          },
          { transaction },
        );

        await OrderItem.create(
          {
            orderId: order.id,
            productId: cartItem.productId,
            productName: product.name,
            unitPrice: product.price,
            quantity: cartItem.quantity,
            totalPrice: product.price * cartItem.quantity,
          },
          { transaction },
        );
      }

      // 5. Clear Cart
      // Delete cart items instead of just disassociating them to avoid notNull violations
      await CartItem.destroy({
        where: { cartId: cart.id },
        transaction,
      });

      cart.totalAmount = 0;
      cart.totalItems = 0;
      await cart.save({ transaction });

      await transaction.commit();

      // Reload order with items
      return (await Order.findByPk(order.id, {
        include: [OrderItem],
      })) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await Order.findAll({
      where: { userId },
      include: [{ model: OrderItem }],
      order: [["createdAt", "DESC"]],
    });
  }

  async getOrderById(id: string, userId?: number): Promise<Order | null> {
    const where: any = { id };
    if (userId) where.userId = userId;

    return await Order.findOne({
      where,
      include: [OrderItem, { model: Address, as: "address" }],
    });
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    const order = await Order.findByPk(id);
    if (!order) return null;

    order.status = status;
    await order.save();
    return order;
  }

  async getAllOrders(
    filters?: OrderFilterInput,
  ): Promise<{ orders: Order[]; totalCount: number }> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const findOptions: FindOptions = {
      where,
      include: [{ model: OrderItem }, { model: Address, as: "address" }],
      order: [["createdAt", "DESC"]],
    };

    if (filters?.limit) {
      findOptions.limit = filters.limit;
    }

    if (filters?.offset) {
      findOptions.offset = filters.offset;
    }

    const { rows: orders, count: totalCount } =
      await Order.findAndCountAll(findOptions);

    return { orders, totalCount };
  }

  async updateFulfillmentStatus(
    orderId: string,
    fulfillmentStatus: FulfillmentStatus,
  ): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    if (!order) return null;

    /**
     * Guardrails:
     * - You should not ship unpaid orders
     * - You should not deliver unshipped orders
     */
    if (order.status !== OrderStatus.PAID) {
      throw new Error("Cannot update fulfillment for unpaid orders");
    }

    order.fulfillmentStatus = fulfillmentStatus;
    await order.save();

    return order;
  }
}
