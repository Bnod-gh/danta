import { Module } from '@nestjs/common';
import { CommunicationPreferencesService } from './communication-preferences.service';
import { CommunicationPreferencesController } from './communication-preferences.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CommunicationPreferencesController],
  providers: [CommunicationPreferencesService],
  exports: [CommunicationPreferencesService],
})
export class CommunicationPreferencesModule {}
