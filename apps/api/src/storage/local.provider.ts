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

  private resolvePath(key: string): string {
    const safeKey = key.replace(/^\/+/, '').replace(/\/+$/, '');
    if (safeKey.includes('..') || path.isAbsolute(safeKey)) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    const fullPath = path.resolve(this.basePath, safeKey);
    const baseResolved = path.resolve(this.basePath);
    if (!fullPath.startsWith(baseResolved + path.sep) && fullPath !== baseResolved) {
      throw new Error('Invalid storage key: path escapes storage directory');
    }
    return fullPath;
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = this.resolvePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return key;
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    await fs.unlink(fullPath).catch(() => {});
  }

  getUrl(key: string): string {
    return `/storage/${key}`;
  }
}
