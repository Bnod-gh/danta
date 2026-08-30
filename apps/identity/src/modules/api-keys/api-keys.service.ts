import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '@danta/config';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, data: {
    name: string;
    scopes: string[];
    expiresAt?: Date;
    rateLimit?: { max: number; windowMs: number };
    ipAllowlist?: string[];
  }) {
    const secret = this.generateSecret();
    const keyHash = await bcrypt.hash(secret, 12);
    const keyPrefix = secret.slice(0, 16);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        userId,
        name: data.name,
        env: env.apiKeyEnv,
        version: 1,
        keyHash,
        keyPrefix,
        scopes: data.scopes,
        ...(data.rateLimit ? { rateLimit: data.rateLimit } : {}),
        ...(data.ipAllowlist !== undefined ? { ipAllowlist: data.ipAllowlist } : {}),
        expiresAt: data.expiresAt,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      env: apiKey.env,
      version: apiKey.version,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      ipAllowlist: apiKey.ipAllowlist as string[] | undefined,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      secret,
    };
  }

  async findAll(tenantId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        env: true,
        version: true,
        scopes: true,
        rateLimit: true,
        ipAllowlist: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  async revoke(tenantId: string, id: string, userId: string, reason?: string) {
    const apiKey = await this.prisma.apiKey.update({
      where: { id, tenantId },
      data: {
        revokedAt: new Date(),
        revokedBy: userId,
        revocationReason: reason ?? null,
      },
    });

    return apiKey;
  }

  async validateKey(secret: string): Promise<{
    id: string;
    tenantId: string;
    userId: string;
    scopes: string[];
    env: string;
    rateLimit?: { max: number; windowMs: number };
    ipAllowlist?: string[];
    type: 'api-key';
  } | null> {
    const keyPrefix = secret.slice(0, 16);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyPrefix },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        keyHash: true,
        scopes: true,
        env: true,
        rateLimit: true,
        ipAllowlist: true,
        revokedAt: true,
        expiresAt: true,
        graceExpiresAt: true,
      },
    });

    if (!apiKey) {
      return null;
    }

    if (apiKey.revokedAt !== null) {
      return null;
    }

    if (apiKey.expiresAt !== null && apiKey.expiresAt <= new Date()) {
      return null;
    }

    if (apiKey.graceExpiresAt !== null && apiKey.graceExpiresAt <= new Date()) {
      return null;
    }

    if (apiKey.env !== env.apiKeyEnv) {
      return null;
    }

    const isValid = await bcrypt.compare(secret, apiKey.keyHash);
    if (!isValid) {
      return null;
    }

    const identity = {
      id: apiKey.id,
      tenantId: apiKey.tenantId,
      userId: apiKey.userId,
      scopes: apiKey.scopes as string[],
      env: apiKey.env,
      rateLimit: apiKey.rateLimit as { max: number; windowMs: number } | undefined,
      ipAllowlist: apiKey.ipAllowlist as string[] | undefined,
    };

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      ...identity,
      type: 'api-key',
    };
  }

  async rotate(tenantId: string, id: string, _userId: string) {
    const oldKey = await this.prisma.apiKey.findFirst({
      where: { id, tenantId, revokedAt: null },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        name: true,
        env: true,
        scopes: true,
        rateLimit: true,
        expiresAt: true,
        version: true,
        revokedAt: true,
        graceExpiresAt: true,
        keyPrefix: true,
      },
    });

    if (!oldKey) {
      throw new BadRequestException('API key not found');
    }

    if (oldKey.revokedAt !== null) {
      throw new BadRequestException('API key has been revoked');
    }

    if (oldKey.graceExpiresAt !== null && oldKey.graceExpiresAt <= new Date()) {
      throw new BadRequestException('API key has expired and cannot be rotated');
    }

    const newSecret = this.generateSecret();
    const newKeyHash = await bcrypt.hash(newSecret, 12);
    const newKeyPrefix = newSecret.slice(0, 16);
    const newVersion = oldKey.version + 1;

    const newKey = await this.prisma.apiKey.create({
      data: {
        tenantId: oldKey.tenantId,
        userId: oldKey.userId,
        name: oldKey.name,
        env: oldKey.env,
        version: newVersion,
        keyHash: newKeyHash,
        keyPrefix: newKeyPrefix,
        scopes: oldKey.scopes as any,
        rateLimit: oldKey.rateLimit as any,
        expiresAt: oldKey.expiresAt,
        previousKeyId: oldKey.id,
      },
    });

    await this.prisma.apiKey.update({
      where: { id: oldKey.id },
      data: { graceExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    return {
      id: newKey.id,
      name: newKey.name,
      keyPrefix: newKey.keyPrefix,
      env: newKey.env,
      version: newKey.version,
      scopes: newKey.scopes,
      rateLimit: newKey.rateLimit,
      lastUsedAt: newKey.lastUsedAt,
      expiresAt: newKey.expiresAt,
      createdAt: newKey.createdAt,
      secret: newSecret,
    };
  }

  private generateSecret(): string {
    const bytes = crypto.randomBytes(24);
    return 'danta_' + Buffer.from(bytes).toString('base64url');
  }
}
