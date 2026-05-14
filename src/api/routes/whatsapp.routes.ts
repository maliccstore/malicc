import { Router } from "express";
import WhatsAppService from "../../service/whatsapp.service";
import { getTokenFromRequest, verifyToken } from "../../utils/auth";
import { CustomerType } from "../../enums/CustomerType";
import { PurchaseActivity } from "../../enums/PurchaseActivity";
import { UserRole } from "../../enums/UserRole";


const router = Router();

// Middleware to authenticate admin for REST routes
const adminAuthMiddleware = (req: any, res: any, next: any) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = verifyToken(token);
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

router.post("/campaigns/audience/estimate", adminAuthMiddleware, async (req, res) => {
  try {
    const { customerType, purchasedWithinDays, minSpent } = req.body;

    // Validation
    if (customerType && !Object.values(CustomerType).includes(customerType)) {
      return res.status(400).json({ message: "Invalid customerType" });
    }

    if (purchasedWithinDays && !Object.values(PurchaseActivity).includes(purchasedWithinDays)) {
      return res.status(400).json({ message: "Invalid purchasedWithinDays. Use 30, 60, or 90." });
    }

    if (minSpent && typeof minSpent !== 'number') {
      return res.status(400).json({ message: "minSpent must be a number" });
    }

    const count = await WhatsAppService.estimateAudience({
      customerType,
      purchasedWithinDays,
      minSpent,
    });

    res.json({
      success: true,
      estimatedRecipients: count,
      filters: {
        customerType: customerType || CustomerType.ALL,
        purchasedWithinDays,
        minSpent,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

export default router;
