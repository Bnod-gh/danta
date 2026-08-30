import { Module } from '@nestjs/common';
import { TreatmentPlanItemsService } from './treatment-plan-items.service';
import { TreatmentPlanItemsController } from './treatment-plan-items.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TreatmentPlanItemsController],
  providers: [TreatmentPlanItemsService],
  exports: [TreatmentPlanItemsService],
})
export class TreatmentPlanItemsModule {}
