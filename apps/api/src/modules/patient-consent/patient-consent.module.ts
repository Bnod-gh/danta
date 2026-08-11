import { Module } from '@nestjs/common';
import { PatientConsentService } from './patient-consent.service';
import { PatientConsentController } from './patient-consent.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientConsentController],
  providers: [PatientConsentService],
  exports: [PatientConsentService],
})
export class PatientConsentModule {}
