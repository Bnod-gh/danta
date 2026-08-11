import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async create(tenantId: string, userId: string, data: { name: string; scopes: string[]; expiresAt?: Date }) {
    const keyPrefix = `danta_${Buffer.from(userId).toString('base64').slice(0, 8)}`;
    const secret = `${keyPrefix}_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(secret, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        userId,
        name: data.name,
        keyHash,
        keyPrefix,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'api_key.create',
      resourceType: 'api_key',
      resourceId: apiKey.id,
      result: 'success',
    });

    return { id: apiKey.id, name: apiKey.name, keyPrefix: apiKey.keyPrefix, scopes: apiKey.scopes, expiresAt: apiKey.expiresAt, secret };
  }

  async findAll(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(tenantId: string, id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.update({
      where: { id, tenantId },
      data: { revokedAt: new Date() },
    });
    await this.auditService.log({
      tenantId,
      userId,
      action: 'api_key.revoke',
      resourceType: 'api_key',
      resourceId: id,
      result: 'success',
    });
    return apiKey;
  }

  async validateKey(tenantId: string, secret: string) {
    const prefix = secret.split('_').slice(0, 2).join('_');
    const keys = await this.prisma.apiKey.findMany({
      where: { keyPrefix: prefix, tenantId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    for (const key of keys) {
      if (await bcrypt.compare(secret, key.keyHash)) {
        return key;
      }
    }
    return null;
  }
}
