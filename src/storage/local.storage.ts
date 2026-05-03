import { StorageProvider } from "./storage.interface";
import fs from "fs/promises";
import path from "path";
import fsSync from "fs";

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadRoot = path.join(process.cwd(), "public");

  async save(file: Buffer, filename: string, folder: string): Promise<string> {
    const targetDir = path.join(this.uploadRoot, folder);
    
    if (!fsSync.existsSync(targetDir)) {
      fsSync.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, file);

    // Return the relative path for URL generation
    return path.join(folder, filename).replace(/\\/g, "/");
  }
}
