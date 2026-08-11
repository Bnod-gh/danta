import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post(':id/approve')
  @RequirePermissions('settings:manage')
  async approve(@Param('id') id: string, @Req() req: Request) {
    return this.tenantsService.approve(id, (req.user as any)?.id);
  }

  @Post(':id/reject')
  @RequirePermissions('settings:manage')
  async reject(@Param('id') id: string, @Req() req: Request) {
    return this.tenantsService.reject(id, (req.user as any)?.id);
  }
}
