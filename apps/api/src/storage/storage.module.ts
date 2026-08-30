import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage.interface';
import { getStorageProvider } from './storage.providers';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService): StorageProvider => {
        const provider = configService.get<string>('STORAGE_PROVIDER') || configService.get<string>('storageProvider') || 'local';
        return getStorageProvider(provider);
      },
      inject: [ConfigService],
    },
  ],
  exports: [{ provide: STORAGE_PROVIDER, module: StorageModule }],
})
export class StorageModule {}
