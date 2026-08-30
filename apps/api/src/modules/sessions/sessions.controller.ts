import { Controller, Get, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

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
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:manage')
  async revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sessionsService.revokeSession(id, user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings:manage')
  async revokeAll(@CurrentUser() user: AuthenticatedUser, @Body('sessionId') sessionId?: string) {
    return this.sessionsService.revokeAllSessions(user.id, sessionId);
  }
}
