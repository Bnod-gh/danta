import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { API_KEY_SCOPES_KEY } from '../decorators/api-key-scopes.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // S6: Superadmin bypass — grants unrestricted access
    const superadminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    if (superadminEmail && user.email?.toLowerCase() === superadminEmail.toLowerCase()) {
      return true;
    }

    // Superadmin role bypass — grants unrestricted access
    if (user.role === 'superadmin') {
      return true;
    }

    // API-KEY BYPASS: Check required API Key scopes (S2 fix)
    if (user.type === 'api-key') {
      const requiredScopes = this.reflector.getAllAndOverride<string[]>(API_KEY_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      
      if (!requiredScopes || requiredScopes.length === 0) {
        throw new ForbiddenException('API key access not allowed for this endpoint');
      }
      
      const hasScope = requiredScopes.every(scope => user.scopes.includes(scope));
      if (!hasScope) {
        throw new ForbiddenException('Insufficient API key scopes');
      }
      return true;
    }

    // Normal permission check for non-superadmin users
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Q11: Derive permissions from JWT instead of DB
    const userPermissions = user.permissions || [];

    const hasPermission = requiredPermissions.every((required) => {
      return userPermissions.includes(required);
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

