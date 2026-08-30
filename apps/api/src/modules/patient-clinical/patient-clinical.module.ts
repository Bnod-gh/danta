import { Module } from '@nestjs/common';
import { PatientClinicalService } from './patient-clinical.service';
import { PatientClinicalController } from './patient-clinical.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PatientClinicalController],
  providers: [PatientClinicalService],
  exports: [PatientClinicalService],
})
export class PatientClinicalModule {}
