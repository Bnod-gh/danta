import { Controller, Get, Post, Body, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('auth')
  @RequirePermissions('audit:manage')
  async logAuthEvent(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; action: string; result: string; metadata?: any }) {
    return this.auditService.log({ tenantId: user.tenantId, userId: body.userId, action: body.action, result: body.result, metadata: body.metadata });
  }

  @Post('authorization')
  @RequirePermissions('audit:manage')
  async logAuthorizationEvent(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; action: string; resourceType: string; resourceId: string; result: string }) {
    return this.auditService.log({ tenantId: user.tenantId, userId: body.userId, action: body.action, resourceType: body.resourceType, resourceId: body.resourceId, result: body.result });
  }

  @Post('patient-access')
  @RequirePermissions('audit:manage')
  async logPatientAccess(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; patientId: string; action: string; result: string }) {
    return this.auditService.log({ tenantId: user.tenantId, userId: body.userId, action: body.action, result: body.result, metadata: { patientId: body.patientId } });
  }

  @Post('clinical')
  @RequirePermissions('audit:manage')
  async logClinicalEvent(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; patientId: string; action: string; metadata?: any }) {
    return this.auditService.log({ tenantId: user.tenantId, userId: body.userId, action: body.action, metadata: { ...body.metadata, patientId: body.patientId } });
  }

  @Post('billing')
  @RequirePermissions('audit:manage')
  async logBillingEvent(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; action: string; resourceType: string; resourceId: string; result: string; metadata?: any }) {
    return this.auditService.log({ tenantId: user.tenantId, userId: body.userId, action: body.action, resourceType: body.resourceType, resourceId: body.resourceId, result: body.result, metadata: body.metadata });
  }

  @Get()
  @RequirePermissions('audit:read')
  async searchAuditLogs(@CurrentUser() user: AuthenticatedUser, @Query() query: any, @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number, @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number) {
    return this.auditService.search({ tenantId: user.tenantId, ...query, skip, take });
  }

  @Get('stats')
  @RequirePermissions('audit:read')
  async getAuditStats(@CurrentUser() user: AuthenticatedUser, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.auditService.stats({ tenantId: user.tenantId, startDate: new Date(startDate), endDate: new Date(endDate) });
  }
}
