import express from "express";
import { adminRestAuth } from "../../middlewares/adminAuth";
import { usageService } from "../../service/usage.service";

const router = express.Router();

// Secure these routes so only admin can view them
router.use(adminRestAuth);

/**
 * GET /api/admin/usage/snapshots
 * Query params:
 *   days - number (optional, default: 30)
 *   storeId - string (ignored, single-tenant)
 */
router.get("/snapshots", async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const storeId = (req.query.storeId as string) || "malicc_dev_001";
    const snapshots = await usageService.getSnapshots(days);

    res.json({
      status: "ok",
      storeId,
      days,
      count: snapshots.length,
      snapshots,
    });
  } catch (error: any) {
    console.error("[Usage/Snapshots] Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

/**
 * GET /api/admin/usage/summary
 * Query params:
 *   from - string (required, YYYY-MM-DD)
 *   to - string (required, YYYY-MM-DD)
 *   storeId - string (ignored, single-tenant)
 */
router.get("/summary", async (req, res) => {
  try {
    const storeId = (req.query.storeId as string) || "malicc_dev_001";
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({ error: "from and to query params are required" });
    }

    const summary = await usageService.getSnapshotSummary(from, to);

    res.json({
      status: "ok",
      storeId,
      from,
      to,
      summary: {
        totalStorageBytes: summary.totalStorageBytes,
        totalBandwidthBytes: summary.totalBandwidthBytes,
        totalWhatsappMessages: summary.totalWhatsappMessages,
        totalOrdersCount: summary.totalOrdersCount,
        daysReported: summary.daysReported,
      },
    });
  } catch (error: any) {
    console.error("[Usage/Summary] Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;
