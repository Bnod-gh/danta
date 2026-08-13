import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { StatementsService } from './statements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { StatementQuery } from '@danta/schemas';

@Controller('statements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get()
  @RequirePermissions('billing:read')
  async generate(@CurrentUser() user: AuthenticatedUser, @Query() query: StatementQuery) {
    return this.statementsService.generate(user.tenantId, query, user.id);
  }
}
