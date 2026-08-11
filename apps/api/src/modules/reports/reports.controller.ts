import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import type { ReportQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports:read')
  async getDashboard(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getDashboard(user.tenantId, query);
  }

  @Get('revenue')
  @RequirePermissions('reports:read')
  async getRevenue(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getRevenue(user.tenantId, query);
  }

  @Get('production')
  @RequirePermissions('reports:read')
  async getProduction(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getProduction(user.tenantId, query);
  }

  @Get('collections')
  @RequirePermissions('reports:read')
  async getCollections(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getCollections(user.tenantId, query);
  }

  @Get('appointments')
  @RequirePermissions('reports:read')
  async getAppointments(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getAppointments(user.tenantId, query);
  }

  @Get('practitioners')
  @RequirePermissions('reports:read')
  async getPractitioners(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getPractitioners(user.tenantId, query);
  }

  @Get('recalls')
  @RequirePermissions('reports:read')
  async getRecalls(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getRecalls(user.tenantId, query);
  }

  @Get('patients')
  @RequirePermissions('reports:read')
  async getPatients(@Req() req: Request, @Query() query: ReportQuery) {
    const user = req.user as any;
    return this.reportsService.getPatients(user.tenantId, query);
  }
}
