import { Module } from '@nestjs/common';
import { PatientSurgicalHistoryService } from './patient-surgical-history.service';
import { PatientSurgicalHistoryController } from './patient-surgical-history.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientSurgicalHistoryController],
  providers: [PatientSurgicalHistoryService],
  exports: [PatientSurgicalHistoryService],
})
export class PatientSurgicalHistoryModule {}
