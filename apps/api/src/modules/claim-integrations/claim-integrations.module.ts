import { Module } from '@nestjs/common';
import { ClaimIntegrationsService } from './claim-integrations.service';
import { ClaimIntegrationsController } from './claim-integrations.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ClaimIntegrationsController],
  providers: [ClaimIntegrationsService],
  exports: [ClaimIntegrationsService],
})
export class ClaimIntegrationsModule {}
