import { Module } from '@nestjs/common';
import { PatientAlertsService } from './patient-alerts.service';
import { PatientAlertsController } from './patient-alerts.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientAlertsController],
  providers: [PatientAlertsService],
  exports: [PatientAlertsService],
})
export class PatientAlertsModule {}
