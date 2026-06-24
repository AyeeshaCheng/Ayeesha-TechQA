import type { StorageAdapter, UploadResult } from './adapter';

/**
 * S3/OSS Cloud Storage Adapter (future implementation)
 *
 * When ready, implement the StorageAdapter interface using @aws-sdk/client-s3
 * or a compatible OSS SDK. Swap `src/lib/storage/local.ts` for this adapter
 * in all import sites (they all reference the interface through `adapter.ts`).
 */
export class S3StorageAdapter implements StorageAdapter {
  constructor(_bucket: string, _region: string) {
    throw new Error('S3 storage adapter not yet implemented. Use LocalStorageAdapter for now.');
  }

  async upload(_file: File, _filename: string): Promise<UploadResult> {
    throw new Error('Not implemented');
  }

  async delete(_filename: string): Promise<void> {
    throw new Error('Not implemented');
  }

  getUrl(_filename: string): string {
    throw new Error('Not implemented');
  }
}
