export interface UploadResult {
  url: string;
  storagePath: string;
}

export interface StorageAdapter {
  upload(file: File, filename: string): Promise<UploadResult>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
}
