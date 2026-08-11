import { Module } from '@nestjs/common';
import { AppointmentTypesService } from './appointment-types.service';
import { AppointmentTypesController } from './appointment-types.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AppointmentTypesController],
  providers: [AppointmentTypesService],
  exports: [AppointmentTypesService],
})
export class AppointmentTypesModule {}
