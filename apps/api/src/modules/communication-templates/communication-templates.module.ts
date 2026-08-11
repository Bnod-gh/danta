import { Module } from '@nestjs/common';
import { CommunicationTemplatesService } from './communication-templates.service';
import { CommunicationTemplatesController } from './communication-templates.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CommunicationTemplatesController],
  providers: [CommunicationTemplatesService],
  exports: [CommunicationTemplatesService],
})
export class CommunicationTemplatesModule {}
