import { Module } from '@nestjs/common';
import { DentalChartsService } from './dental-charts.service';
import { DentalChartsController } from './dental-charts.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DentalChartsController],
  providers: [DentalChartsService],
  exports: [DentalChartsService],
})
export class DentalChartsModule {}
