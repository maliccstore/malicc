import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { UsageSnapshot } from "../models/UsageSnapshot";
import { Product } from "../models/ProductModel";

interface DailyBuffer {
  date: string; // 'YYYY-MM-DD'
  storageBytes: bigint;
  bandwidthBytes: bigint;
  whatsappMessages: number;
  ordersCount: number;
  productCount: number;
}

/**
 * UsageService
 *
 * Tracks billable metrics for this malicc instance. All counters are held
 * in an in-memory buffer and flushed to the DB periodically by UsageSyncJob.
 *
 * Design principles:
 *  - No billing logic lives here — only raw measurements.
 *  - Writes to DB happen in batches (via flushToDb), not on every event.
 *  - Day-rollover is detected automatically; old day is persisted before reset.
 *  - Storage is measured by a disk scan, not per-upload (handles deletions).
 */
export class UsageService {
  private buffer: DailyBuffer;
  private readonly uploadsRoot: string;
  private flushing = false;

  constructor() {
    this.uploadsRoot = path.join(process.cwd(), "public", "uploads");
    this.buffer = this.createEmptyBuffer();
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private today(): string {
    return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  }

  private createEmptyBuffer(): DailyBuffer {
    return {
      date: this.today(),
      storageBytes: 0n,
      bandwidthBytes: 0n,
      whatsappMessages: 0,
      ordersCount: 0,
      productCount: 0,
    };
  }

  /**
   * Checks if the calendar day has changed since the buffer was initialised.
   * If so, flushes the previous day's data and resets the buffer.
   * Must be called before any write to the buffer.
   */
  private async ensureDayIsCurrent(): Promise<void> {
    const currentDate = this.today();
    if (this.buffer.date !== currentDate) {
      console.log(
        `[UsageService] Day rolled over from ${this.buffer.date} → ${currentDate}. Flushing old buffer.`
      );
      // Flush old day before resetting — don't await to keep callers non-blocking
      this.flushToDb().catch((err) =>
        console.error("[UsageService] Flush on day-rollover failed:", err)
      );
      this.buffer = this.createEmptyBuffer();
    }
  }

  /**
   * Recursively calculates the total size (bytes) of all files under a directory.
   */
  private calculateDirSize(dirPath: string): bigint {
    let total = 0n;

    if (!fs.existsSync(dirPath)) return total;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += this.calculateDirSize(fullPath);
      } else if (entry.isFile()) {
        try {
          total += BigInt(fs.statSync(fullPath).size);
        } catch {
          // File may have been deleted between readdir and stat — ignore
        }
      }
    }

    return total;
  }

  // ─── Public Increment Methods ──────────────────────────────────────────────

  /**
   * Call this after each successfully delivered WhatsApp template message.
   * @param count - defaults to 1
   */
  public incrementWhatsAppMessages(count = 1): void {
    this.ensureDayIsCurrent().then(() => {
      this.buffer.whatsappMessages += count;
    });
  }

  /**
   * Call this when an order transitions to PAID status.
   * @param count - defaults to 1
   */
  public incrementOrders(count = 1): void {
    this.ensureDayIsCurrent().then(() => {
      this.buffer.ordersCount += count;
    });
  }

  /**
   * Accumulates estimated outbound bandwidth bytes.
   * Called by requestSniffer middleware on each response finish.
   * @param bytes - Content-Length of the HTTP response
   */
  public addBandwidthBytes(bytes: bigint): void {
    this.ensureDayIsCurrent().then(() => {
      this.buffer.bandwidthBytes += bytes;
    });
  }

  // ─── Measurement Methods ───────────────────────────────────────────────────

  /**
   * Scans the uploads directory and updates the buffer's storageBytes.
   * This is intentionally NOT called on every upload — it's scheduled
   * periodically by UsageSyncJob to capture the true on-disk size.
   */
  public async refreshStorageBytes(): Promise<void> {
    try {
      await this.ensureDayIsCurrent();
      const bytes = this.calculateDirSize(this.uploadsRoot);
      this.buffer.storageBytes = bytes;
      console.log(
        `[UsageService] Storage refreshed: ${bytes.toLocaleString()} bytes`
      );
    } catch (err) {
      console.error("[UsageService] Failed to refresh storage bytes:", err);
    }
  }

  /**
   * Queries the DB for the current active product count and stores it
   * in the buffer. Called during each flush so HQ always gets a fresh count.
   */
  private async refreshProductCount(): Promise<void> {
    try {
      const count = await Product.count({ where: { isActive: true } });
      this.buffer.productCount = count;
    } catch (err) {
      console.error("[UsageService] Failed to refresh product count:", err);
    }
  }

  // ─── DB Persistence ────────────────────────────────────────────────────────

  /**
   * Upserts the current in-memory buffer into the usage_snapshots table.
   * Called every 10 minutes by UsageSyncJob, and on day rollover.
   *
   * Uses Sequelize's upsert so re-runs are idempotent.
   * Incremental columns (whatsappMessages, ordersCount, bandwidthBytes) are
   * merged with whatever is already in the DB for today, so partial flushes
   * across restarts don't lose data.
   */
  public async flushToDb(): Promise<void> {
    if (this.flushing) {
      console.log("[UsageService] Flush already in progress, skipping.");
      return;
    }

    this.flushing = true;

    try {
      await this.refreshProductCount();

      const date = this.buffer.date;

      // Fetch existing row for today (if any) to merge incremental fields
      const existing = await UsageSnapshot.findOne({ where: { date } });

      if (existing) {
        // Merge: add buffer deltas on top of what's persisted.
        // This handles the case where the server restarted mid-day.
        await existing.update({
          storageBytes: this.buffer.storageBytes.toString(),
          bandwidthBytes: (
            BigInt(existing.bandwidthBytes || "0") + this.buffer.bandwidthBytes
          ).toString(),
          whatsappMessages:
            existing.whatsappMessages + this.buffer.whatsappMessages,
          ordersCount: existing.ordersCount + this.buffer.ordersCount,
          productCount: this.buffer.productCount,
        });

        // Reset incremental counters in buffer after merging into DB
        // (storage and productCount are always overwritten, not additive)
        this.buffer.bandwidthBytes = 0n;
        this.buffer.whatsappMessages = 0;
        this.buffer.ordersCount = 0;
      } else {
        // First flush for this day — create the row
        await UsageSnapshot.create({
          date,
          storageBytes: this.buffer.storageBytes.toString(),
          bandwidthBytes: this.buffer.bandwidthBytes.toString(),
          whatsappMessages: this.buffer.whatsappMessages,
          ordersCount: this.buffer.ordersCount,
          productCount: this.buffer.productCount,
          syncedAt: null,
        } as any);

        // Reset incremental counters after first persist
        this.buffer.bandwidthBytes = 0n;
        this.buffer.whatsappMessages = 0;
        this.buffer.ordersCount = 0;
      }

      console.log(`[UsageService] Flushed usage snapshot for ${date}`);
    } catch (err) {
      console.error("[UsageService] flushToDb failed:", err);
    } finally {
      this.flushing = false;
    }
  }

  // ─── Read Access ───────────────────────────────────────────────────────────

  /**
   * Returns the current in-memory metrics combined with the latest DB row.
   * Useful for admin dashboards or health checks.
   */
  public async getTodaySnapshot(): Promise<{
    date: string;
    storageBytes: string;
    bandwidthBytes: string;
    whatsappMessages: number;
    ordersCount: number;
    productCount: number;
    syncedAt: Date | null;
  }> {
    const date = this.today();
    const persisted = await UsageSnapshot.findOne({ where: { date } });

    return {
      date,
      storageBytes: this.buffer.storageBytes.toString(),
      bandwidthBytes: (
        BigInt(persisted?.bandwidthBytes || "0") + this.buffer.bandwidthBytes
      ).toString(),
      whatsappMessages:
        (persisted?.whatsappMessages ?? 0) + this.buffer.whatsappMessages,
      ordersCount: (persisted?.ordersCount ?? 0) + this.buffer.ordersCount,
      productCount: this.buffer.productCount || persisted?.productCount || 0,
      syncedAt: persisted?.syncedAt ?? null,
    };
  }

  /**
   * Returns all unsynced snapshots from the database.
   * Used by UsageSyncService to build the HQ payload.
   */
  public async getUnsyncedSnapshots(): Promise<UsageSnapshot[]> {
    return UsageSnapshot.findAll({
      where: { syncedAt: { [Op.is]: null as any } },
      order: [["date", "ASC"]],
    });
  }
}

// Export singleton instance — injected into all callers
export const usageService = new UsageService();
