import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
      throw new ForbiddenException('Invalid API key');
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
