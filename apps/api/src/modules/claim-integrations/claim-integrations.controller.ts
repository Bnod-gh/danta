import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('provider') provider?: string) {
    const user = req.user as any;
    return this.claimIntegrationsService.findAll(user.tenantId, provider);
  }

  @Get(':id')
  @RequirePermissions('claims:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.claimIntegrationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('claims:submit')
  async create(@Req() req: Request, @Body() body: CreateClaimIntegration) {
    const user = req.user as any;
    return this.claimIntegrationsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('claims:submit')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateClaimIntegration) {
    const user = req.user as any;
    return this.claimIntegrationsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('claims:submit')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.claimIntegrationsService.remove(user.tenantId, user.id, id);
  }
}
