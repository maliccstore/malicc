import cron from "node-cron";
import { Coupon } from "../models/Coupon";
import { Op } from "sequelize";

export class CouponExpirationJob {
  static start() {
    // Runs every hour
    cron.schedule("0 * * * *", async () => {
      console.log(" Running coupon expiration cleanup...");

      const now = new Date();

      try {
        const [affectedRows] = await Coupon.update(
          { isActive: false },
          {
            where: {
              isActive: true,
              validUntil: {
                [Op.lt]: now,
              },
            },
          },
        );

        if (affectedRows > 0) {
          console.log(` Disabled ${affectedRows} expired coupons`);
        } else {
          console.log("No expired coupons found");
        }
      } catch (error) {
        console.error("Coupon expiration job failed:", error);
      }
    });
  }
}
