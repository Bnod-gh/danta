import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CommunicationDispatchService } from './dispatch/communication-dispatch.service';
import type { CreateMessage } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('communication')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationController {
  constructor(private readonly communicationDispatchService: CommunicationDispatchService) {}

  @Post('send')
  @RequirePermissions('communication:manage')
  async sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateMessage) {
    return this.communicationDispatchService.sendMessage(user.tenantId, user.id, body);
  }

  @Get('messages/:id/status')
  @RequirePermissions('communication:read')
  async getDeliveryStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communicationDispatchService.getDeliveryStatus(user.tenantId, id);
  }

  @Post('messages/:id/retry')
  @RequirePermissions('communication:manage')
  async retryFailedMessage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communicationDispatchService.retryFailedMessage(user.tenantId, user.id, id);
  }
}
