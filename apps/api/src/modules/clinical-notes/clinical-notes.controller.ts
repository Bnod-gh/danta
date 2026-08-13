import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ClinicalNotesService } from './clinical-notes.service';
import type { CreateClinicalNote, UpdateClinicalNote } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('clinical-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get()
  @RequirePermissions('clinical:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('patientId') patientId?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    return this.clinicalNotesService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clinicalNotesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateClinicalNote) {
    return this.clinicalNotesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateClinicalNote) {
    return this.clinicalNotesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clinicalNotesService.remove(user.tenantId, user.id, id);
  }
}
