import { Controller, Post, Body } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import type { AcceptInvitation } from '@danta/schemas';
import { Public } from '../../common/decorators/permissions.decorator';

@Controller('invitations')
@Public()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('accept')
  async accept(@Body() body: AcceptInvitation) {
    return this.invitationsService.accept(body.token, {
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  }
}
