import { StorageProvider } from "../storage/storage.interface";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import sharp from "sharp";

export class UploadService {
  private readonly allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(private readonly storageProvider: StorageProvider) {}

  async uploadProductImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    fileSize: number,
  ): Promise<{ url: string; filename: string }> {
    // Validate file type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error("Invalid file type. Only jpg, jpeg, png, and webp are allowed.");
    }

    // Validate file size
    if (fileSize > this.maxFileSize) {
      throw new Error("File size exceeds 5MB limit.");
    }

    // Generate UUID filename with .webp extension
    const filename = `${uuidv4()}.webp`;
    const folder = "uploads/products";

    // Convert to WebP using sharp
    const webpBuffer = await sharp(fileBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    // Save using storage provider
    const relativePath = await this.storageProvider.save(
      webpBuffer,
      filename,
      folder,
    );

    // Return URL and filename
    return {
      url: `/${relativePath}`,
      filename: filename,
    };
  }
}
