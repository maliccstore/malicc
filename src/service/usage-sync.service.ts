import appConfig from "../config";
import { UsageSnapshot } from "../models/UsageSnapshot";
import { usageService } from "./usage.service";

interface SnapshotPayload {
  date: string;
  storageBytes: string;
  bandwidthBytes: string;
  whatsappMessages: number;
  ordersCount: number;
  productCount: number;
}

interface UsageSyncPayload {
  storeId: string;
  snapshots: SnapshotPayload[];
}

/**
 * UsageSyncService
 *
 * Responsible for pushing accumulated usage snapshots from this malicc
 * instance to malicc-hq. Only handles transport — no billing logic.
 *
 * Flow:
 *  1. Flush today's in-memory metrics to DB (ensure nothing is lost).
 *  2. Read all unsynced rows (syncedAt IS NULL) from usage_snapshots.
 *  3. POST them as a batch to HQ_USAGE_ENDPOINT.
 *  4. Mark successfully acknowledged rows with syncedAt = now().
 */
export class UsageSyncService {
  private readonly storeId: string;
  private readonly hqEndpoint: string | undefined;
  private readonly bridgeSecret: string | undefined;

  constructor() {
    this.storeId = appConfig.STORE_ID;
    this.hqEndpoint = appConfig.HQ_USAGE_ENDPOINT;
    this.bridgeSecret = appConfig.EVENT_BRIDGE_SECRET;
  }

  /**
   * Returns true if HQ sync is configured, false otherwise.
   * If not configured, syncToHQ() logs a warning and exits early.
   */
  private isConfigured(): boolean {
    return !!(this.hqEndpoint && this.bridgeSecret);
  }

  /**
   * Main sync method. Called by UsageSyncJob on schedule.
   *
   * Flushes today's buffer first, then ships all unsynced rows to HQ.
   * Rows are marked `syncedAt` only after HQ acknowledges them, so a
   * failed request causes a retry on the next run.
   */
  public async syncToHQ(): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }


    // 1. Flush today's in-memory metrics before reading unsynced rows
    await usageService.flushToDb();

    // 2. Fetch all unsynced snapshots
    const unsynced = await usageService.getUnsyncedSnapshots();

    if (unsynced.length === 0) {
      return;
    }


    // 3. Build payload
    const payload: UsageSyncPayload = {
      storeId: this.storeId,
      snapshots: unsynced.map((row) => ({
        date: row.date,
        storageBytes: row.storageBytes,
        bandwidthBytes: row.bandwidthBytes,
        whatsappMessages: row.whatsappMessages,
        ordersCount: row.ordersCount,
        productCount: row.productCount,
      })),
    };


    // 4. POST to malicc-hq
    let responseOk = false;
    try {
      const response = await fetch(this.hqEndpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bridge-Secret": this.bridgeSecret!,
          "X-Store-Id": this.storeId,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        responseOk = true;
      } else {
        // Fail silently
      }
    } catch (err: any) {
      // Fail silently
    }

    // 5. Mark rows as synced only on success
    if (responseOk) {
      const now = new Date();
      const ids = unsynced.map((row) => row.id);

      await UsageSnapshot.update(
        { syncedAt: now },
        { where: { id: ids } }
      );
    }
  }
}

// Export singleton
export const usageSyncService = new UsageSyncService();
