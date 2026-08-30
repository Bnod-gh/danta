import { Controller, Post, Get, UseGuards, Body, Query, Res } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditSearchService } from './audit-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Response } from 'express';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditSearchController {
  constructor(private readonly auditSearchService: AuditSearchService) {}

  @Post('search')
  @RequirePermissions('audit:read')
  async advancedSearch(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    return this.auditSearchService.advancedSearch({ ...body, tenantId: user.tenantId });
  }

  @Get('export')
  @RequirePermissions('audit:read')
  async exportAuditLogs(@CurrentUser() user: AuthenticatedUser, @Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('format') format: 'csv' | 'json', @Res() res: Response) {
    const data = await this.auditSearchService.exportAuditLogs(user.tenantId, new Date(startDate), new Date(endDate), format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(data);
    }
  }
}
