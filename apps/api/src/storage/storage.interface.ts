import { Readable } from 'node:stream';

export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  download(key: string): Promise<Readable>;
}

export const STORAGE_PROVIDERS = {
  local: 'local',
  minio: 'minio',
} as const;

export type StorageProviderKey = keyof typeof STORAGE_PROVIDERS;
