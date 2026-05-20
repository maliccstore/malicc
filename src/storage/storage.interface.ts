export interface StorageProvider {
  save(file: Buffer, filename: string, folder: string): Promise<string>;
  delete(filePath: string): Promise<void>;
}
