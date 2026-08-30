import { Controller, Post, Param, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthenticatedRequest = any & { user: any };

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private assertPlatformAdministrator(user: any) {
    if (user.role !== 'platform_owner' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Platform administrator access required');
    }
  }

  @Post(':id/approve')
  @RequirePermissions('settings:manage')
  async approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const user = req.user;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('settings:manage')
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const user = req.user;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.reject(id, user.id);
  }

  @Get('pending')
  @RequirePermissions('settings:manage')
  async findPending(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.findPending(user.tenantId, user.id);
  }
}
