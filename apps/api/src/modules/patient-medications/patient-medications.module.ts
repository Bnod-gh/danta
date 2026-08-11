import { Module } from '@nestjs/common';
import { PatientMedicationsService } from './patient-medications.service';
import { PatientMedicationsController } from './patient-medications.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientMedicationsController],
  providers: [PatientMedicationsService],
  exports: [PatientMedicationsService],
})
export class PatientMedicationsModule {}
