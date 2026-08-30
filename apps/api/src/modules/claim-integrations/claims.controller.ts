import { Controller, Get, Post, Body, Param, Query, UseGuards, Put } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ClaimsService } from './claims.service';
import type { CreateClaim, ClaimQuery, UpdateClaimStatus } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('claims')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @RequirePermissions('claims:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ClaimQuery) {
    return this.claimsService.findAllClaims(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('claims:submit')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateClaim) {
    return this.claimsService.createClaim(user.tenantId, user.id, body);
  }

  @Get(':id')
  @RequirePermissions('claims:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimsService.findOneClaim(user.tenantId, id);
  }

  @Get(':id/history')
  @RequirePermissions('claims:read')
  async history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimsService.getClaimHistory(user.tenantId, id);
  }

  @Put(':id/status')
  @RequirePermissions('claims:submit')
  async updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateClaimStatus) {
    return this.claimsService.updateClaimStatus(user.tenantId, user.id, id, body);
  }

  @Post(':id/submit')
  @RequirePermissions('claims:submit')
  async submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { integrationId?: string }) {
    return this.claimsService.submitClaim(user.tenantId, user.id, id, body?.integrationId);
  }
}
