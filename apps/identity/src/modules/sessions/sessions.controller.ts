import { Controller, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @RequirePermissions('settings:manage')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionsService.findUserSessions(user.id);
  }

  @Delete(':id')
  @RequirePermissions('settings:manage')
  async revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sessionsService.revokeSession(id, user.id);
  }

  @Delete()
  @RequirePermissions('settings:manage')
  async revokeAll(@CurrentUser() user: AuthenticatedUser, @Body('sessionId') sessionId?: string) {
    return this.sessionsService.revokeAllSessions(user.id, sessionId);
  }
}
