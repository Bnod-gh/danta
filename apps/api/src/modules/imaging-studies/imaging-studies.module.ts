import { Module } from '@nestjs/common';
import { ImagingStudiesService } from './imaging-studies.service';
import { ImagingStudiesController } from './imaging-studies.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ImagingStudiesController],
  providers: [ImagingStudiesService],
  exports: [ImagingStudiesService],
})
export class ImagingStudiesModule {}
