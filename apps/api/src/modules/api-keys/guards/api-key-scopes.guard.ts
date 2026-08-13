import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_KEY_SCOPES_KEY } from '../../../common/decorators/api-key-scopes.decorator';

@Injectable()
export class ApiKeyScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== 'api-key') {
      return true;
    }

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(API_KEY_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const apiKeyScopes = (user.scopes as string[]) || [];

    const hasScope = requiredScopes.every((requiredScope) => {
      if (requiredScope === '*') {
        return false;
      }

      if (requiredScope.endsWith(':*')) {
        return false;
      }

      return apiKeyScopes.includes(requiredScope);
    });

    if (!hasScope) {
      throw new ForbiddenException('Insufficient API key scopes');
    }

    return true;
  }
}
