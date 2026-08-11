import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Put, Delete } from '@nestjs/common';
import { Request } from 'express';
import { ImagingImagesService } from './imaging-images.service';
import type { CreateImagingImage, UpdateImagingImage } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('imaging-images')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagingImagesController {
  constructor(private readonly imagingImagesService: ImagingImagesService) {}

  @Get()
  @RequirePermissions('imaging:read')
  async findAll(@Req() req: Request, @Query('imagingStudyId') imagingStudyId?: string) {
    const user = req.user as any;
    return this.imagingImagesService.findAll(user.tenantId, imagingStudyId);
  }

  @Get(':id')
  @RequirePermissions('imaging:read')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingImagesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('imaging:upload')
  async create(@Req() req: Request, @Body() body: CreateImagingImage) {
    const user = req.user as any;
    return this.imagingImagesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('imaging:update')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateImagingImage) {
    const user = req.user as any;
    return this.imagingImagesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('imaging:delete')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.imagingImagesService.remove(user.tenantId, user.id, id);
  }
}
