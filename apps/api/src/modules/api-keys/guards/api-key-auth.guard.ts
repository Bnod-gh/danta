import { Injectable, CanActivate, ExecutionContext, ForbiddenException, HttpException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';
import { AuditService } from '../../audit/audit.service';
import { ApiKeyRateLimitService } from '../services/api-key-rate-limit.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly auditService: AuditService,
    private readonly rateLimitService: ApiKeyRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('Missing API key');
    }

    const secret = authHeader.substring(7);

    if (!secret || secret.length < 16) {
      throw new ForbiddenException('Invalid API key');
    }

    const key = await this.apiKeysService.validateKey(secret);

    if (!key) {
      await this.auditService.log({
        tenantId: 'unknown',
        userId: 'unknown',
        action: 'api_key.auth_failed',
        resourceType: 'api_key',
        metadata: { reason: 'invalid_or_missing_key' },
      });
      throw new ForbiddenException('Invalid API key');
    }

    const rateLimit = key.rateLimit ?? { max: 100, windowMs: 60_000 };
    const rateLimitResult = await this.rateLimitService.checkLimit(
      key.id,
      key.tenantId,
      rateLimit,
    );

    response.setHeader('X-RateLimit-Limit', rateLimit.max);
    response.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    response.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));

    if (!rateLimitResult.allowed) {
      response.setHeader('Retry-After', rateLimitResult.retryAfter ?? 60);
      throw new HttpException('Rate limit exceeded', 429);
    }

    request.user = {
      id: key.id,
      tenantId: key.tenantId,
      userId: key.userId,
      scopes: key.scopes,
      env: key.env,
      type: 'api-key',
    };

    return true;
  }
}
