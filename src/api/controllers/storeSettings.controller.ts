import { Request, Response } from "express";
import { storeSettingsService } from "../../service/storeSettings.service";
import { UploadService } from "../../service/upload.service";
import { LocalStorageProvider } from "../../storage/local.storage";

const storageProvider = new LocalStorageProvider();
const uploadService = new UploadService(storageProvider);

export class StoreSettingsController {
  public async getSettings(req: Request, res: Response) {
    try {
      const settings = await storeSettingsService.getSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public async updateSettings(req: Request, res: Response) {
    try {
      const { store_name, tagline, logo_width, logo_position } = req.body;
      const updatedSettings = await storeSettingsService.updateSettings({
        store_name,
        tagline,
        logo_width,
        logo_position,
      });
      return res.status(200).json({ success: true, data: updatedSettings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(415).json({ success: false, message: "Unsupported Media Type" });
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (req.file.size > maxSize) {
        return res.status(413).json({ success: false, message: "Payload Too Large" });
      }

      // If there's an existing logo, we could delete it, but let's just save the new one and update the url
      const result = await uploadService.uploadStoreLogo(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
      );

      const updatedSettings = await storeSettingsService.updateLogoUrl(result.url);

      const protocol = req.protocol;
      const host = req.get("host");
      const fullUrl = `${protocol}://${host}${result.url}`;

      return res.status(200).json({
        success: true,
        data: {
          url: fullUrl,
          settings: updatedSettings,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public async deleteLogo(req: Request, res: Response) {
    try {
      const settings = await storeSettingsService.getSettings();
      if (settings.logo_url) {
        await storageProvider.delete(settings.logo_url);
        await storeSettingsService.updateLogoUrl(null);
      }
      return res.status(200).json({ success: true, message: "Logo deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const storeSettingsController = new StoreSettingsController();
