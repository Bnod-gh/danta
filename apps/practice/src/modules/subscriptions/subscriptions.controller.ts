import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @RequirePermissions('subscriptions:manage')
  async createSubscription(@CurrentUser() user: AuthenticatedUser, @Body() data: { planId: string; trialDays?: number }) {
    return this.subscriptionsService.createSubscription(user.tenantId, user.id, data);
  }

  @Post(':id/cancel')
  @RequirePermissions('subscriptions:manage')
  async cancelSubscription(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(user.tenantId, user.id, id);
  }

  @Get()
  @RequirePermissions('subscriptions:read')
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getSubscription(user.tenantId);
  }

  @Get('plans')
  @RequirePermissions('subscriptions:read')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Post('usage')
  @RequirePermissions('subscriptions:manage')
  async recordUsage(@CurrentUser() user: AuthenticatedUser, @Body() data: { metric: string; amount: number }) {
    return this.subscriptionsService.recordUsage(user.tenantId, user.id, data);
  }
}
