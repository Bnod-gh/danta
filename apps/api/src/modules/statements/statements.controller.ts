import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
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
  async generate(@Req() req: Request, @Query() query: StatementQuery) {
    const user = req.user as any;
    return this.statementsService.generate(user.tenantId, query);
  }
}
