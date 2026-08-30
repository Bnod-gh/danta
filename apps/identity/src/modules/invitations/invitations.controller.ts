import { Controller, Post, Body } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('accept')
  async accept(@Body() body: { token: string; password: string; firstName: string; lastName: string }) {
    return this.invitationsService.accept(body.token, {
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  }
}
