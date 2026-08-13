import { Controller, Get, UseGuards, Query, Param, Res } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import type { ReportQuery, ExportQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Response } from 'express';
import { arrayToCsv, getCsvFilename } from '../../common/utils/csv.util';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports:read')
  async getDashboard(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getDashboard(user.tenantId, query);
  }

  @Get('revenue')
  @RequirePermissions('reports:read')
  async getRevenue(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getRevenue(user.tenantId, query);
  }

  @Get('production')
  @RequirePermissions('reports:read')
  async getProduction(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getProduction(user.tenantId, query);
  }

  @Get('collections')
  @RequirePermissions('reports:read')
  async getCollections(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getCollections(user.tenantId, query);
  }

  @Get('appointments')
  @RequirePermissions('reports:read')
  async getAppointments(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getAppointments(user.tenantId, query);
  }

  @Get('practitioners')
  @RequirePermissions('reports:read')
  async getPractitioners(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getPractitioners(user.tenantId, query);
  }

  @Get('recalls')
  @RequirePermissions('reports:read')
  async getRecalls(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getRecalls(user.tenantId, query);
  }

  @Get('patients')
  @RequirePermissions('reports:read')
  async getPatients(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getPatients(user.tenantId, query);
  }

  @Get('claims')
  @RequirePermissions('reports:read')
  async getClaims(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getClaims(user.tenantId, query);
  }

  @Get('payments')
  @RequirePermissions('reports:read')
  async getPayments(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getPayments(user.tenantId, query);
  }

  @Get('treatment-acceptance')
  @RequirePermissions('reports:read')
  async getTreatmentAcceptance(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getTreatmentAcceptance(user.tenantId, query);
  }

  @Get('chair-utilization')
  @RequirePermissions('reports:read')
  async getChairUtilization(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getChairUtilization(user.tenantId, query);
  }

  @Get('no-shows')
  @RequirePermissions('reports:read')
  async getNoShows(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQuery) {
    return this.reportsService.getNoShows(user.tenantId, query);
  }

  @Get('export/:reportType')
  @RequirePermissions('reports:read')
  async exportReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExportQuery,
    @Param('reportType') reportType: string,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportReport(user.tenantId, reportType, query);
    const csv = arrayToCsv(result.data, result.headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${getCsvFilename(reportType)}"`);
    res.send(csv);
  }
}
