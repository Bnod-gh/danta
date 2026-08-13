import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('receipts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':paymentId')
  @RequirePermissions('billing:read')
  async generate(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.receiptsService.generate(user.tenantId, paymentId, user.id);
  }
}
