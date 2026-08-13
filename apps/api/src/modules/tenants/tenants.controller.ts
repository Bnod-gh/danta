import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post(':id/approve')
  @RequirePermissions('settings:manage')
  async approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tenantsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('settings:manage')
  async reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tenantsService.reject(id, user.id);
  }
}
