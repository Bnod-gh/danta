import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { PatientsService } from './patients.service';
import type { CreatePatient, UpdatePatient, PatientQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@Req() req: Request, @Query() query: PatientQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.patientsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('patient:create')
  async create(@Req() req: Request, @Body() body: CreatePatient) {
    const user = req.user as any;
    return this.patientsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePatient) {
    const user = req.user as any;
    return this.patientsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.patientsService.remove(user.tenantId, user.id, id);
  }
}
