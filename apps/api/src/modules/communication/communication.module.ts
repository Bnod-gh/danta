import { Module } from '@nestjs/common';
import { CommunicationProviderFactory } from './providers/communication-provider.factory';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { CommunicationDispatchService } from './dispatch/communication-dispatch.service';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CommunicationProviderFactory, SmtpEmailProvider, MockSmsProvider, CommunicationDispatchService],
  exports: [CommunicationDispatchService, CommunicationProviderFactory],
})
export class CommunicationModule {}
