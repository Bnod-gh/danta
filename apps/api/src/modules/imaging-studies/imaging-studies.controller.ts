import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ImagingStudiesService } from './imaging-studies.service';
import type { CreateImagingStudy, UpdateImagingStudy, ImagingStudyQuery } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('imaging-studies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagingStudiesController {
  constructor(private readonly imagingStudiesService: ImagingStudiesService) {}

  @Get()
  @RequirePermissions('imaging:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ImagingStudyQuery) {
    return this.imagingStudiesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('imaging:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingStudiesService.findOne(user.tenantId, id);
  }

  @Post('batch-conditions')
  @RequirePermissions('imaging:read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async batchConditions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { patientId: string; toothNumbers?: number[]; modality?: string },
  ) {
    return this.imagingStudiesService.batchConditions(user.tenantId, body);
  }

  @Post()
  @RequirePermissions('imaging:upload')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateImagingStudy) {
    return this.imagingStudiesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('imaging:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateImagingStudy) {
    return this.imagingStudiesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('imaging:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingStudiesService.remove(user.tenantId, user.id, id);
  }
}
