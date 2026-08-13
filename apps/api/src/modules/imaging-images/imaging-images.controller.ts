import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
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
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('imagingStudyId') imagingStudyId?: string) {
    return this.imagingImagesService.findAll(user.tenantId, imagingStudyId);
  }

  @Get(':id')
  @RequirePermissions('imaging:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingImagesService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('imaging:upload')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateImagingImage) {
    return this.imagingImagesService.create(user.tenantId, user.id, body);
  }

  @Put(':id')
  @RequirePermissions('imaging:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: UpdateImagingImage) {
    return this.imagingImagesService.update(user.tenantId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('imaging:delete')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imagingImagesService.remove(user.tenantId, user.id, id);
  }
}
