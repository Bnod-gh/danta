export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export const STORAGE_PROVIDERS = {
  local: 'local',
  s3: 's3',
  azure: 'azure',
  gcs: 'gcs',
} as const;

export type StorageProviderKey = keyof typeof STORAGE_PROVIDERS;
