import { Module } from '@nestjs/common';
import { PatientPrivacyService } from './patient-privacy.service';
import { PatientPrivacyController } from './patient-privacy.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PatientPrivacyController],
  providers: [PatientPrivacyService],
  exports: [PatientPrivacyService],
})
export class PatientPrivacyModule {}
