import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { PatientFormsController } from './patient-forms.controller';
import { PatientFormsService } from './patient-forms.service';

@Module({
  imports: [PrismaModule],
  controllers: [PatientFormsController],
  providers: [PatientFormsService],
  exports: [PatientFormsService],
})
export class PatientFormsModule {}
