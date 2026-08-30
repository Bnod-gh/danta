import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete, UploadedFile, UseInterceptors, Res, BadRequestException, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { env } from '@danta/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ImagingImagesService } from './imaging-images.service';
import type { CreateImagingImage, UpdateImagingImage } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Response } from 'express';

@Controller('imaging-images')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImagingImagesController {
  constructor(private readonly imagingImagesService: ImagingImagesService) {}

  @Get('/:id/original')
  @RequirePermissions('imaging:read')
  async getOriginal(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Res() res: Response) {
    const result = await this.imagingImagesService.getOriginal(user.tenantId, id);
    res.set('Content-Type', result.mimeType);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);
    const filePath = join(process.cwd(), env.storageLocalPath, result.url.replace('/storage/', ''));
    return new StreamableFile(createReadStream(filePath), { type: result.mimeType });
  }

  @Get('/:id/thumbnail')
  @RequirePermissions('imaging:read')
  async getThumbnail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Res() res: Response) {
    const result = await this.imagingImagesService.getThumbnail(user.tenantId, id);
    res.set('Content-Type', result.mimeType);
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);
    const filePath = join(process.cwd(), env.storageLocalPath, result.url.replace('/storage/', ''));
    return new StreamableFile(createReadStream(filePath), { type: result.mimeType });
  }

  @Post('upload')
  @RequirePermissions('imaging:upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { imagingStudyId: string; toothNumber?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.imagingImagesService.upload(user.tenantId, user.id, file.buffer, {
      imagingStudyId: body.imagingStudyId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      toothNumber: body.toothNumber,
    });
  }

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
