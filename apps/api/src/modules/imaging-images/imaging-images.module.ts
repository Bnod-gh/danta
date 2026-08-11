import { Module } from '@nestjs/common';
import { ImagingImagesService } from './imaging-images.service';
import { ImagingImagesController } from './imaging-images.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ImagingImagesController],
  providers: [ImagingImagesService],
  exports: [ImagingImagesService],
})
export class ImagingImagesModule {}
