import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query('patientId') patientId?: string, @Query('skip', ParseIntPipe) skip?: number, @Query('take', ParseIntPipe) take?: number) {
    const user = req.user as any;
    return this.clinicalNotesService.findAll(user.tenantId, patientId, skip, take);
  }

  @Get(':id')
  @RequirePermissions('clinical:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.clinicalNotesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('clinical:create')
  async create(@Req() req: Request, @Body() body: CreateClinicalNote) {
    const user = req.user as any;
    return this.clinicalNotesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('clinical:amend')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateClinicalNote) {
    const user = req.user as any;
    return this.clinicalNotesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('clinical:amend')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.clinicalNotesService.remove(user.tenantId, user.id, id);
  }
}
