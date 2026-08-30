import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isPublic = request.routeConfig?.isPublic ?? false;
    if (isPublic) {
      return true;
    }

    const requiredPermissions = request.routeConfig?.permissions ?? [];
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if ((user as any).type === 'api-key') {
      return true;
    }

    const superadminEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    if (superadminEmail && user.email?.toLowerCase() === superadminEmail.toLowerCase()) {
      return true;
    }

    if (user.role === 'superadmin') {
      return true;
    }

    const userPermissions: { resource: string; action: string }[] = [];

    const hasPermission = requiredPermissions.every((required: string) => {
      const [resource, action] = required.split(':');
      return userPermissions.some(
        (p) => p.resource === resource && p.action === action,
      );
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}