import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { StorageAdapter, UploadResult } from './adapter';
import { SITE_CONFIG } from '@/config/site';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor(uploadDir = SITE_CONFIG.UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  async upload(file: File, _filename: string): Promise<UploadResult> {
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${randomUUID()}.${ext}`;
    const storagePath = join(this.uploadDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(process.cwd(), storagePath), buffer);

    return {
      url: `/uploads/${uniqueName}`,
      storagePath: uniqueName,
    };
  }

  async delete(filename: string): Promise<void> {
    const filePath = join(process.cwd(), this.uploadDir, filename);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist — ignore
    }
  }

  getUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}

export const storageAdapter = new LocalStorageAdapter();
