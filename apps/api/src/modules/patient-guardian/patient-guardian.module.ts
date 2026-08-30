import { Module } from '@nestjs/common';
import { PatientGuardianService } from './patient-guardian.service';
import { PatientGuardianController } from './patient-guardian.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientGuardianController],
  providers: [PatientGuardianService],
  exports: [PatientGuardianService],
})
export class PatientGuardianModule {}
