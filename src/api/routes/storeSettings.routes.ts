import express from "express";
import { storeSettingsController } from "../controllers/storeSettings.controller";
import { adminRestAuth } from "../../middlewares/adminAuth";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // We limit to 5MB here so Multer doesn't throw a generic error for 2MB,
    // allowing the controller to send a precise 413 error
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", storeSettingsController.getSettings);

router.use(adminRestAuth);

router.patch("/", storeSettingsController.updateSettings);
router.post("/logo", upload.single("file"), storeSettingsController.uploadLogo);
router.delete("/logo", storeSettingsController.deleteLogo);

export default router;
