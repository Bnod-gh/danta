import { Module } from '@nestjs/common';
import { TreatmentExecutionService } from './treatment-execution.service';
import { TreatmentExecutionController } from './treatment-execution.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TreatmentExecutionController],
  providers: [TreatmentExecutionService],
  exports: [TreatmentExecutionService],
})
export class TreatmentExecutionModule {}
