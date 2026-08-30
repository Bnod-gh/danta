import { Module } from '@nestjs/common';
import { PatientMedicalContextService } from './patient-medical-context.service';
import { PatientMedicalContextController } from './patient-medical-context.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientMedicalContextController],
  providers: [PatientMedicalContextService],
  exports: [PatientMedicalContextService],
})
export class PatientMedicalContextModule {}
