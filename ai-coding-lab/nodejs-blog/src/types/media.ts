export interface MediaItem {
  id: number;
  url: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploaderId?: number;
}

export interface MediaUploadResult {
  id: number;
  url: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}
