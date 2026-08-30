import { Controller, Post, Body, Get, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('settings:manage')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: { name: string; scopes: string[]; expiresAt?: Date; rateLimit?: { max: number; windowMs: number }; ipAllowlist?: string[] }) {
    return this.apiKeysService.create(user.tenantId, user.id, body);
  }

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.apiKeysService.findAll(user.tenantId);
  }

  @Post(':id/rotate')
  @RequirePermissions('settings:manage')
  async rotate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.apiKeysService.rotate(user.tenantId, id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:manage')
  async revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.apiKeysService.revoke(user.tenantId, id, user.id, reason);
  }
}
