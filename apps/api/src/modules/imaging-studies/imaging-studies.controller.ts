import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Req() req: Request, @Query() query: ImagingStudyQuery) {
    const user = req.user as any;
    return this.imagingStudiesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('imaging:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingStudiesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('imaging:upload')
  async create(@Req() req: Request, @Body() body: CreateImagingStudy) {
    const user = req.user as any;
    return this.imagingStudiesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('imaging:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateImagingStudy) {
    const user = req.user as any;
    return this.imagingStudiesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('imaging:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingStudiesService.remove(user.tenantId, user.id, id);
  }
}
