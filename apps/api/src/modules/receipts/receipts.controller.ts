import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { Request } from 'express';
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
  async generate(@Req() req: Request, @Param('paymentId') paymentId: string) {
    const user = req.user as any;
    return this.receiptsService.generate(user.tenantId, paymentId);
  }
}
