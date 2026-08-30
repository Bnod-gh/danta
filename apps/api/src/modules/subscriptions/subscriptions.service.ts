import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateSubscriptionInput, RecordUsageInput, UsageStats } from '@danta/schemas';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async getPlans() {
    return this.prisma.subscription_plans.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscriptions.findFirst({
      where: { tenantId },
      include: { subscription_plans: true },
      orderBy: { createdAt: 'desc' },
    });
    return subscription;
  }

  async createSubscription(tenantId: string, userId: string, data: CreateSubscriptionInput) {
    const existing = await this.prisma.subscriptions.findFirst({
      where: { tenantId },
    });
    if (existing) {
      throw new BadRequestException('A subscription already exists for this tenant');
    }

    const plan = await this.getPlan(data.planId);

    const now = new Date();
    const trialEndsAt = data.trialDays
      ? new Date(now.getTime() + data.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const periodEnd = new Date(now);
    if (plan.interval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription = await this.prisma.subscriptions.create({
      data: {
        tenantId,
        planId: plan.id,
        status: trialEndsAt ? 'trialing' : 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt,
      },
      include: { subscription_plans: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'subscription.create',
      resourceType: 'subscription',
      resourceId: subscription.id,
      result: 'success',
      metadata: { planId: plan.id, planName: plan.name, trialDays: data.trialDays },
    });

    return subscription;
  }

  async cancelSubscription(tenantId: string, userId: string, id: string) {
    const subscription = await this.prisma.subscriptions.findFirst({
      where: { id, tenantId },
      include: { subscription_plans: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      include: { subscription_plans: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'subscription.cancel',
      resourceType: 'subscription',
      resourceId: subscription.id,
      result: 'success',
      metadata: { planName: subscription.subscription_plans.name },
    });

    return updated;
  }

  async recordUsage(tenantId: string, userId: string, data: RecordUsageInput) {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) throw new NotFoundException('No active subscription found');
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      throw new BadRequestException('Cannot record usage on a cancelled or expired subscription');
    }

    const record = await this.prisma.usage_records.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        metric: data.metric,
        amount: data.amount,
        recordedAt: new Date(),
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'subscription.usage.record',
      resourceType: 'usage_record',
      resourceId: record.id,
      result: 'success',
      metadata: { metric: data.metric, amount: data.amount },
    });

    return record;
  }

  async checkEntitlement(tenantId: string, feature: string) {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return false;
    if (subscription.status === 'cancelled' || subscription.status === 'expired') return false;

    const features = (subscription.subscription_plans.features as Record<string, boolean>) || {};
    return features[feature] === true;
  }

  async getUsageStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return [];

    const recordedAtFilter: Record<string, Date> = {};
    if (startDate) recordedAtFilter.gte = startDate;
    if (endDate) recordedAtFilter.lte = endDate;

    const where: Record<string, unknown> = {
      tenantId,
      subscriptionId: subscription.id,
    };
    if (Object.keys(recordedAtFilter).length > 0) {
      where.recordedAt = recordedAtFilter;
    }

    const records = await this.prisma.usage_records.findMany({ where });

    const statsMap = new Map<string, { metric: string; total: number; count: number }>();
    for (const r of records) {
      const existing = statsMap.get(r.metric) || { metric: r.metric, total: 0, count: 0 };
      existing.total += Number(r.amount);
      existing.count += 1;
      statsMap.set(r.metric, existing);
    }

    return Array.from(statsMap.values()).map((s) => ({
      metric: s.metric,
      total: s.total,
      count: s.count,
      average: s.count > 0 ? s.total / s.count : 0,
    })) as UsageStats[];
  }

  async getUsageHistory(tenantId: string, metric?: string, limit = 100) {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return [];

    const where: Record<string, unknown> = {
      tenantId,
      subscriptionId: subscription.id,
    };
    if (metric) where.metric = metric;

    return this.prisma.usage_records.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }
}
