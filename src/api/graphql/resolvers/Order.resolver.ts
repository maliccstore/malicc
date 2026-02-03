import { Resolver, Query, Mutation, Arg, Authorized, Ctx } from "type-graphql";
import { Service } from "typedi";
import { OrderService } from "../../../service/order.service";
import {
  OrderSchema,
  OrderResponse,
  OrdersResponse,
} from "../schemas/order.schema";
import { UserToken } from "../../../types/user";
import { UserRole } from "../../../enums/UserRole";
import { OrderFilterInput } from "../inputs/OrderInput";
import { OrderStatus } from "../../../enums/OrderStatus";
import { FulfillmentStatus } from "../../../enums/FulfillmentStatus";

@Service()
@Resolver(() => OrderSchema)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Authorized()
  @Mutation(() => OrderResponse)
  async checkout(
    @Ctx() { user, session }: { user: UserToken; session: any },
    @Arg("addressId") addressId: number,
    @Arg("paymentMethod", { defaultValue: "COD" }) paymentMethod: string,
  ): Promise<OrderResponse> {
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated or ID missing");
      }

      const order = await this.orderService.createOrderFromCart(
        user.id,
        addressId,
        paymentMethod,
        session?.sessionId,
      );

      return {
        success: true,
        message: "Order placed successfully",
        order: order as any,
      };
    } catch (error) {
      console.error("Checkout error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Checkout failed",
      };
    }
  }

  @Authorized()
  @Query(() => OrdersResponse)
  async myOrders(
    @Ctx() { user }: { user: UserToken },
  ): Promise<OrdersResponse> {
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated or ID missing");
      }

      const orders = await this.orderService.getUserOrders(user.id);

      return {
        success: true,
        orders: orders as any,
      };
    } catch (error) {
      console.error("Fetch orders error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch orders",
        orders: [],
      };
    }
  }

  @Authorized()
  @Query(() => OrderResponse)
  async order(
    @Ctx() { user }: { user: UserToken },
    @Arg("id") id: string,
  ): Promise<OrderResponse> {
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated or ID missing");
      }

      const order = await this.orderService.getOrderById(id, user.id);

      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      return {
        success: true,
        order: order as any,
      };
    } catch (error) {
      console.error("Fetch order error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch order",
      };
    }
  }
  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Query(() => OrdersResponse)
  async adminOrders(
    @Arg("filters", { nullable: true }) filters?: OrderFilterInput,
  ): Promise<OrdersResponse> {
    try {
      const { orders, totalCount } =
        await this.orderService.getAllOrders(filters);

      return {
        success: true,
        message: "Orders fetched successfully",
        orders: orders as any,
        totalCount,
      };
    } catch (error) {
      console.error("Admin fetch orders error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch orders",
        orders: [],
        totalCount: 0,
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => OrderResponse)
  async updateOrderStatus(
    @Arg("id") id: string,
    @Arg("status", () => OrderStatus) status: OrderStatus,
  ): Promise<OrderResponse> {
    try {
      const order = await this.orderService.updateOrderStatus(id, status);

      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      return {
        success: true,
        message: "Order status updated successfully",
        order: order as any,
      };
    } catch (error) {
      console.error("Update order status error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      };
    }
  }

  @Authorized(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Mutation(() => OrderResponse)
  async updateFulfillmentStatus(
    @Arg("id") id: string,
    @Arg("status", () => FulfillmentStatus) status: FulfillmentStatus,
  ): Promise<OrderResponse> {
    try {
      const order = await this.orderService.updateFulfillmentStatus(id, status);

      if (!order) {
        return {
          success: false,
          message: "Order not found",
        };
      }

      return {
        success: true,
        message: "Fulfillment status updated successfully",
        order: order as any,
      };
    } catch (error) {
      console.error("Update fulfillment status error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update fulfillment status",
      };
    }
  }
}
