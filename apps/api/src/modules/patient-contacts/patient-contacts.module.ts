import { Module } from '@nestjs/common';
import { PatientContactsService } from './patient-contacts.service';
import { PatientContactsController } from './patient-contacts.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientContactsController],
  providers: [PatientContactsService],
  exports: [PatientContactsService],
})
export class PatientContactsModule {}
