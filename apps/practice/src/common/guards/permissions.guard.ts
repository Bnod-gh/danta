import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

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

    const userPermissions = await this.prisma.permission.findMany({
      where: {
        roles: {
          some: {
            role: {
              assignments: {
                some: { userId: user.id },
              },
            },
          },
        },
      },
      select: {
        resource: true,
        action: true,
      },
    });

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
