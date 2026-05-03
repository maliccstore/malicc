import { Request, Response } from "express";
import { UploadService } from "../../service/upload.service";
import multer from "multer";

// Multer middleware with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  public uploadMiddleware = upload.single("file");

  public uploadProductImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const result = await this.uploadService.uploadProductImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
      );

      // Construct the full URL for the response
      const protocol = req.protocol;
      const host = req.get("host");
      const fullUrl = `${protocol}://${host}${result.url}`;

      return res.status(200).json({
        success: true,
        data: {
          url: fullUrl,
          filename: result.filename,
        },
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "An error occurred during upload",
      });
    }
  };
}
