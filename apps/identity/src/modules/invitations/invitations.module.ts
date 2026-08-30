import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
