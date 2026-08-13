import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PatientQuery, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    return this.patientsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('patient:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreatePatient) {
    return this.patientsService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdatePatient) {
    return this.patientsService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientsService.remove(user.tenantId, user.id, id);
  }
}
