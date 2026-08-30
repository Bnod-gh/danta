import { apiGet, apiPost } from './request';

export type SubscriptionPlanInterval = 'monthly' | 'yearly';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: SubscriptionPlanInterval;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
};

export type UsageRecord = {
  id: string;
  tenantId: string;
  subscriptionId: string;
  metric: string;
  amount: number;
  recordedAt: string;
  createdAt: string;
};

export type UsageStats = {
  metric: string;
  total: number;
  count: number;
  average: number;
};

export type CreateSubscriptionInput = {
  planId: string;
  trialDays?: number;
};

export type RecordUsageInput = {
  metric: string;
  amount: number;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiGet('/api/v1/subscriptions/plans');
}

export async function getSubscription(): Promise<Subscription | null> {
  try {
    return await apiGet('/api/v1/subscriptions');
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createSubscription(data: CreateSubscriptionInput): Promise<Subscription> {
  return apiPost('/api/v1/subscriptions', data);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  return apiPost(`/api/v1/subscriptions/${id}/cancel`);
}

export async function recordUsage(data: RecordUsageInput): Promise<UsageRecord> {
  return apiPost('/api/v1/subscriptions/usage', data);
}

export async function checkEntitlement(feature: string): Promise<{ feature: string; entitled: boolean }> {
  return apiGet(`/api/v1/subscriptions/entitlements?feature=${encodeURIComponent(feature)}`);
}

export async function getUsageStats(metric?: string): Promise<UsageStats[]> {
  return apiGet('/api/v1/subscriptions/usage-stats', { metric });
}

export async function getUsageHistory(metric?: string, limit?: number): Promise<UsageRecord[]> {
  return apiGet('/api/v1/subscriptions/usage-history', { metric, limit });
}
