import { Module } from '@nestjs/common';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { AppointmentRemindersController } from './appointment-reminders.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AppointmentRemindersController],
  providers: [AppointmentRemindersService],
  exports: [AppointmentRemindersService],
})
export class AppointmentRemindersModule {}
