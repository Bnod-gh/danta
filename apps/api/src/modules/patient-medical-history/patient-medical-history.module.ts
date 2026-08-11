import { Module } from '@nestjs/common';
import { PatientMedicalHistoryService } from './patient-medical-history.service';
import { PatientMedicalHistoryController } from './patient-medical-history.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientMedicalHistoryController],
  providers: [PatientMedicalHistoryService],
  exports: [PatientMedicalHistoryService],
})
export class PatientMedicalHistoryModule {}
