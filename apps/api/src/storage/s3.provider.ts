import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@danta/config';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.client = new S3Client({
      endpoint: env.minioEndpoint || 'http://localhost:9000',
      region: env.minioRegion || 'us-east-1',
      credentials: {
        accessKeyId: env.minioAccessKey || 'minioadmin',
        secretAccessKey: env.minioSecretKey || 'minioadmin',
      },
      forcePathStyle: true,
    });

    this.bucket = env.minioBucket || 'danta-storage';
    this.publicUrl = env.minioPublicUrl || env.minioEndpoint || 'http://localhost:9000';
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      }),
    );
    return key;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    ).catch(() => {});
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}
