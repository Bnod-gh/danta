import { Module } from '@nestjs/common';
import { ImagingIntegrationsService } from './imaging-integrations.service';
import { ImagingIntegrationsController } from './imaging-integrations.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ImagingIntegrationsController],
  providers: [ImagingIntegrationsService],
  exports: [ImagingIntegrationsService],
})
export class ImagingIntegrationsModule {}
