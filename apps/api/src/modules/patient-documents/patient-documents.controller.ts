import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete, UploadedFile, UseInterceptors, Res, BadRequestException, StreamableFile, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PatientDocumentsService } from './patient-documents.service';
import { STORAGE_PROVIDER } from '../../storage/storage.module';
import { StorageProvider } from '../../storage/storage.interface';
import type { CreatePatientDocument, UpdatePatientDocument } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Response } from 'express';

@Controller('patients/:patientId/documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientDocumentsController {
  constructor(
    private readonly patientDocumentsService: PatientDocumentsService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  @Get()
  @RequirePermissions('patient:read')
  async findAll(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.patientDocumentsService.findAll(user.tenantId, patientId);
  }

  @Post('upload')
  @RequirePermissions('patient:update')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('patientId') patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.patientDocumentsService.upload(user.tenantId, patientId, user.id, file.buffer, {
      fileName: body.name,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: `${user.tenantId}/${patientId}/${body.name}-${Date.now()}-${file.originalname}`,
    });
  }

  @Post()
  @RequirePermissions('patient:update')
  async create(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Body() body: CreatePatientDocument) {
    return this.patientDocumentsService.create(user.tenantId, patientId, user.id, body);
  }

  @Get(':id/download')
  @RequirePermissions('patient:read')
  async download(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Res() res: Response) {
    const document = await this.patientDocumentsService.findOne(user.tenantId, patientId, id);
    res.set('Content-Type', document.mimeType);
    res.set('Content-Disposition', `inline; filename="${document.name}"`);
    const fileStream = await this.storageProvider.download(document.storageKey);
    return new StreamableFile(fileStream, { type: document.mimeType });
  }

  @Get(':id')
  @RequirePermissions('patient:read')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientDocumentsService.findOne(user.tenantId, patientId, id);
  }

  @Put(':id')
  @RequirePermissions('patient:update')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string, @Body() body: UpdatePatientDocument) {
    return this.patientDocumentsService.update(user.tenantId, patientId, user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('patient:update')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientDocumentsService.remove(user.tenantId, patientId, user.id, id);
  }
}
