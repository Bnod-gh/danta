import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH || './storage';
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return key;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    await fs.unlink(fullPath).catch(() => {});
  }

  getUrl(key: string): string {
    return `/storage/${key}`;
  }
}
