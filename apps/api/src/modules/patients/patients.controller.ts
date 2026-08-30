import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import type { CreatePatient, UpdatePatient, PatientQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { OptionalParseIntPipe } from '../../common/pipes/optional-parse-int.pipe';

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PatientQuery, @Query('skip', OptionalParseIntPipe) skip?: number, @Query('take', OptionalParseIntPipe) take?: number) {
    return this.patientsService.findAll(user.tenantId, query, skip, take);
  }

  @Get(':id/imaging')
  @RequirePermissions('imaging:read')
  async getImaging(@CurrentUser() user: AuthenticatedUser, @Param('id') patientId: string) {
    return this.patientsService.getImaging(user.tenantId, patientId);
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientsService.findOne(user.tenantId, id);
  }

  @Get(':id/workspace')
  @RequirePermissions('patient:read')
  async getWorkspace(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.patientsService.getWorkspace(user.tenantId, id);
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
