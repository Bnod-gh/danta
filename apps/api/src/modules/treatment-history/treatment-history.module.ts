import { Module } from '@nestjs/common';
import { TreatmentHistoryService } from './treatment-history.service';
import { TreatmentHistoryController } from './treatment-history.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TreatmentHistoryController],
  providers: [TreatmentHistoryService],
  exports: [TreatmentHistoryService],
})
export class TreatmentHistoryModule {}
