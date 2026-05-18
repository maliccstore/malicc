import express from "express";
import { UploadController } from "../controllers/upload.controller";
import { UploadService } from "../../service/upload.service";
import { LocalStorageProvider } from "../../storage/local.storage";

const router = express.Router();

// Dependency Injection
const storageProvider = new LocalStorageProvider();
const uploadService = new UploadService(storageProvider);
const uploadController = new UploadController(uploadService);

// Route definition
router.post(
  "/product-image",
  uploadController.uploadMiddleware,
  uploadController.uploadProductImage,
);

router.post(
  "/campaign-banner",
  uploadController.uploadMiddleware,
  uploadController.uploadCampaignBanner,
);

router.post(
  "/store-logo",
  uploadController.uploadMiddleware,
  uploadController.uploadStoreLogo,
);

router.post(
  "/homepage-banner",
  uploadController.uploadMiddleware,
  uploadController.uploadHomepageBanner,
);

export default router;
