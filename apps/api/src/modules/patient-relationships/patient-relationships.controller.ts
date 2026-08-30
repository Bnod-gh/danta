import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientRelationshipsService } from './patient-relationships.service';
import { CreatePatientRelationship, UpdatePatientRelationship } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('patients/:patientId/relationships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientRelationshipsController {
  constructor(private readonly relationshipsService: PatientRelationshipsService) {}

  @Get()
  @RequirePermissions('patient:read')
  async list(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.relationshipsService.list(user.tenantId, patientId);
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientRelationship) {
    return this.relationshipsService.create(user.tenantId, user.id, patientId, body);
  }

  @Put(':relationshipId')
  @RequirePermissions('patient:update')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() body: UpdatePatientRelationship,
  ) {
    return this.relationshipsService.update(user.tenantId, user.id, patientId, relationshipId, body);
  }

  @Delete(':relationshipId')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('relationshipId') relationshipId: string) {
    return this.relationshipsService.remove(user.tenantId, user.id, patientId, relationshipId);
  }
}
