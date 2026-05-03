import cron from "node-cron";
import { Order } from "../models/Order";
import { Op } from "sequelize";
import { OrderStatus } from "../enums/OrderStatus";
import { Container } from "typedi";
import { OrderService } from "../service/order.service";

/**
 * OrderCleanupJob
 * Automatically cancels orders that remain in CREATED status for more than 15 minutes.
 * This ensures inventory is returned to stock if the user abandons the checkout process.
 */
export class OrderCleanupJob {
  static start() {
    // Runs every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      console.log("🕒 Running stale order cleanup...");

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const orderService = Container.get(OrderService);

      try {
        const staleOrders = await Order.findAll({
          where: {
            status: OrderStatus.CREATED,
            createdAt: {
              [Op.lt]: fifteenMinutesAgo,
            },
          },
        });

        if (staleOrders.length > 0) {
          console.log(`🧹 Found ${staleOrders.length} stale orders. Processing...`);

          for (const order of staleOrders) {
            try {
              // Update status to FAILED which will trigger inventory restoration via OrderService
              await orderService.updateOrderStatus(order.id, OrderStatus.FAILED);
              console.log(`✅ Order ${order.id} cancelled due to inactivity.`);
            } catch (error) {
              console.error(`❌ Failed to cleanup order ${order.id}:`, error);
            }
          }
        } else {
          console.log("✨ No stale orders found.");
        }
      } catch (error) {
        console.error("❌ Order cleanup job failed:", error);
      }
    });
  }
}
