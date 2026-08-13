import { StorageProvider, STORAGE_PROVIDERS } from './storage.interface';
import { LocalStorageProvider } from './local.provider';
import { S3StorageProvider } from './s3.provider';

export const STORAGE_PROVIDER_MAP: Record<string, StorageProvider> = {
  [STORAGE_PROVIDERS.local]: new LocalStorageProvider(),
  [STORAGE_PROVIDERS.minio]: new S3StorageProvider(),
};

export function getStorageProvider(provider: string): StorageProvider {
  return STORAGE_PROVIDER_MAP[provider] || STORAGE_PROVIDER_MAP[STORAGE_PROVIDERS.local];
}
