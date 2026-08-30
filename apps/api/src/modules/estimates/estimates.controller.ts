import { Body, Controller, Get, Param, ParseIntPipe, DefaultValuePipe, Post, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { parseOrBadRequest } from '../../common/utils/parse-or-bad-request';
import {
  CreateEstimateSchema,
  CreateEstimateFromPlanSchema,
  RecordEstimateDecisionSchema,
} from '@danta/schemas';
import { EstimatesService } from './estimates.service';

@Controller('estimates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  @RequirePermissions('billing:read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('treatmentPlanId') treatmentPlanId?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
  ) {
    return this.estimatesService.findAll(user.tenantId, { patientId, status, treatmentPlanId }, skip, take);
  }

  @Get(':id')
  @RequirePermissions('billing:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.estimatesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('billing:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = parseOrBadRequest(CreateEstimateSchema, body);
    return this.estimatesService.create(user.tenantId, user.id, data);
  }

  @Post('from-plan')
  @RequirePermissions('billing:create')
  async createFromPlan(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const data = parseOrBadRequest(CreateEstimateFromPlanSchema, body);
    return this.estimatesService.createFromPlan(user.tenantId, user.id, data);
  }

  @Post(':id/present')
  @RequirePermissions('billing:create')
  async present(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.estimatesService.present(user.tenantId, user.id, id);
  }

  @Post(':id/decision')
  @RequirePermissions('billing:create')
  async decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
    @Body() body: unknown,
  ) {
    const data = parseOrBadRequest(RecordEstimateDecisionSchema, body);
    return this.estimatesService.decide(user.tenantId, user.id, id, data, {
      ip: (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post(':id/cancel')
  @RequirePermissions('billing:create')
  async cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.estimatesService.cancel(user.tenantId, user.id, id);
  }
}
