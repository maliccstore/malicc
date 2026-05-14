import cron from "node-cron";
import { usageService } from "../service/usage.service";
import { usageSyncService } from "../service/usage-sync.service";

/**
 * UsageSyncJob
 *
 * Two scheduled tasks:
 *
 *  1. Every 10 minutes — flush the in-memory usage buffer to the database
 *     and refresh the storage byte count from disk. This keeps the DB
 *     reasonably up-to-date even between daily syncs.
 *
 *  2. Daily at 02:00 AM — push all unsynced snapshots to malicc-hq.
 *     The previous day's snapshot will be complete by this point.
 */
export class UsageSyncJob {
  static start() {
    // ── Task 1: Periodic local flush every 10 minutes ─────────────────────
    cron.schedule("*/10 * * * *", async () => {
      console.log("[UsageSyncJob] Running periodic usage flush...");
      try {
        // Refresh disk storage measurement first
        await usageService.refreshStorageBytes();
        // Then persist the full buffer to DB
        await usageService.flushToDb();
        console.log("[UsageSyncJob] Usage flush complete.");
      } catch (err) {
        console.error("[UsageSyncJob] Periodic flush failed:", err);
      }
    });

    // ── Task 2: Daily HQ sync at 02:00 AM ─────────────────────────────────
    cron.schedule("0 2 * * *", async () => {
      console.log("[UsageSyncJob] Running daily HQ sync...");
      try {
        await usageSyncService.syncToHQ();
        console.log("[UsageSyncJob] Daily HQ sync complete.");
      } catch (err) {
        console.error("[UsageSyncJob] Daily HQ sync failed:", err);
      }
    });

    console.log(
      "[UsageSyncJob] Scheduled: flush every 10 min, HQ sync daily at 02:00 AM."
    );
  }
}
