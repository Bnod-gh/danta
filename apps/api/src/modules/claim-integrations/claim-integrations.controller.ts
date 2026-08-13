import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ClaimIntegrationsService } from './claim-integrations.service';
import type { CreateClaimIntegration, UpdateClaimIntegration } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('claim-integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClaimIntegrationsController {
  constructor(private readonly claimIntegrationsService: ClaimIntegrationsService) {}

  @Get()
  @RequirePermissions('claims:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('provider') provider?: string) {
    return this.claimIntegrationsService.findAll(user.tenantId, provider);
  }

  @Get(':id')
  @RequirePermissions('claims:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimIntegrationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('claims:submit')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateClaimIntegration) {
    return this.claimIntegrationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('claims:submit')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateClaimIntegration) {
    return this.claimIntegrationsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('claims:submit')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimIntegrationsService.remove(user.tenantId, user.id, id);
  }
}
