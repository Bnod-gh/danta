import { Controller, Post, Param, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private assertPlatformAdministrator(user: AuthenticatedUser) {
    if (user.role !== 'platform_owner' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Platform administrator access required');
    }
  }

  @Post(':id/approve')
  @RequirePermissions('settings:manage')
  async approve(@Req() req: any, @Param('id') id: string) {
    const user = req.user as AuthenticatedUser;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('settings:manage')
  async reject(@Req() req: any, @Param('id') id: string) {
    const user = req.user as AuthenticatedUser;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.reject(id, user.id);
  }

  @Get('pending')
  @RequirePermissions('settings:manage')
  async findPending(@Req() req: any) {
    const user = req.user as AuthenticatedUser;
    this.assertPlatformAdministrator(user);
    return this.tenantsService.findPending(user.tenantId, user.id);
  }
}
