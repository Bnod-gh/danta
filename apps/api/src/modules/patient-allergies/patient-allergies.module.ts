import { Module } from '@nestjs/common';
import { PatientAllergiesService } from './patient-allergies.service';
import { PatientAllergiesController } from './patient-allergies.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientAllergiesController],
  providers: [PatientAllergiesService],
  exports: [PatientAllergiesService],
})
export class PatientAllergiesModule {}
