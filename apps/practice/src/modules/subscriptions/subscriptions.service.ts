import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createSubscription(tenantId: string, _userId: string, data: { planId: string; trialDays?: number }) {
    const existing = await this.prisma.subscriptions.findFirst({ where: { tenantId } });
    if (existing) throw new BadRequestException('A subscription already exists for this tenant');

    const plan = await this.getPlan(data.planId);
    const now = new Date();
    const trialEndsAt = data.trialDays ? new Date(now.getTime() + data.trialDays * 24 * 60 * 60 * 1000) : null;
    const periodEnd = new Date(now);
    if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    return this.prisma.subscriptions.create({
      data: {
        id: randomUUID(),
        tenantId,
        planId: plan.id,
        status: trialEndsAt ? 'trialing' : 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt,
        updatedAt: now,
      },
      include: { subscription_plans: true },
    });
  }

  async cancelSubscription(tenantId: string, _userId: string, id: string) {
    const subscription = await this.prisma.subscriptions.findFirst({ where: { id, tenantId }, include: { subscription_plans: true } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status === 'cancelled') throw new BadRequestException('Subscription is already cancelled');
    return this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
      include: { subscription_plans: true },
    });
  }

  async recordUsage(tenantId: string, _userId: string, data: { metric: string; amount: number }) {
    const subscription = await this.prisma.subscriptions.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    if (!subscription) throw new NotFoundException('No active subscription');
    return this.prisma.usage_records.create({
      data: {
        id: randomUUID(),
        subscriptionId: subscription.id,
        tenantId,
        metric: data.metric,
        amount: data.amount,
        recordedAt: new Date(),
      },
    });
  }

  async checkEntitlement(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.prisma.subscriptions.findFirst({ where: { tenantId }, include: { subscription_plans: true }, orderBy: { createdAt: 'desc' } });
    if (!subscription || subscription.status === 'cancelled') return false;
    const features = (subscription.subscription_plans.features as string[]) || [];
    return features.includes(feature);
  }

  async getUsageStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: { tenantId: string; createdAt?: { gte: Date; lte: Date } } = { tenantId };
    if (startDate && endDate) where.createdAt = { gte: startDate, lte: endDate };
    const usageRecords = await this.prisma.usage_records.findMany({ where, select: { metric: true, amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    const stats = usageRecords.reduce((acc: Record<string, { total: number; count: number }>, record: { metric: string; amount: unknown }) => {
      if (!acc[record.metric]) acc[record.metric] = { total: 0, count: 0 };
      acc[record.metric].total += Number(record.amount);
      acc[record.metric].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    return { stats, totalRecords: usageRecords.length };
  }
}