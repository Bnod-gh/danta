import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import type { CreateSubscriptionInput, RecordUsageInput } from '@danta/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @RequirePermissions('subscriptions:manage')
  async createSubscription(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateSubscriptionInput) {
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
  async recordUsage(@CurrentUser() user: AuthenticatedUser, @Body() data: RecordUsageInput) {
    if (!data.metric || data.amount === undefined) {
      throw new BadRequestException('metric and amount are required');
    }
    return this.subscriptionsService.recordUsage(user.tenantId, user.id, data);
  }

  @Get('entitlements')
  @RequirePermissions('subscriptions:read')
  async checkEntitlement(@CurrentUser() user: AuthenticatedUser, @Query('feature') feature: string) {
    if (!feature) throw new BadRequestException('feature query parameter is required');
    const entitled = await this.subscriptionsService.checkEntitlement(user.tenantId, feature);
    return { feature, entitled };
  }

  @Get('usage-stats')
  @RequirePermissions('subscriptions:read')
  async getUsageStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.subscriptionsService.getUsageStats(user.tenantId, start, end);
  }

  @Get('usage-history')
  @RequirePermissions('subscriptions:read')
  async getUsageHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('metric') metric?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionsService.getUsageHistory(user.tenantId, metric, limit ? parseInt(limit, 10) : 100);
  }
}
