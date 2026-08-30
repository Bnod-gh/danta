import { Module } from '@nestjs/common';
import { ImagingImagesService } from './imaging-images.service';
import { ImagingImagesController } from './imaging-images.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [PrismaModule, AuditModule, StorageModule],
  controllers: [ImagingImagesController],
  providers: [ImagingImagesService],
  exports: [ImagingImagesService],
})
export class ImagingImagesModule {}
