import { apiGet, apiPost, apiDownload } from './request';

export type AuditLogRecord = {
  id: string;
  tenantId: string;
  userId: string | null;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  result: string;
  metadata: unknown;
  createdAt: string;
};

export type AuditStats = {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  byResult: Array<{ result: string; count: number }>;
  byResourceType: Array<{ resourceType: string | null; count: number }>;
  topUsers: Array<{ userId: string | null; _count: { userId: number } }>;
};

export type AuditFilters = {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  skip?: number;
  take?: number;
};

export async function getAuditLogs(filters?: AuditFilters): Promise<{ data: AuditLogRecord[]; total: number; skip: number; take: number }> {
  return apiGet('/api/v1/audit', filters);
}

export async function getAuditStats(startDate: string, endDate: string): Promise<AuditStats> {
  return apiGet('/api/v1/audit/stats', { startDate, endDate });
}

export async function advancedAuditSearch(filters: AuditFilters): Promise<{ data: AuditLogRecord[]; total: number; skip: number; take: number }> {
  return apiPost('/api/v1/audit/search', filters);
}

export async function exportAuditLogs(startDate: string, endDate: string, format: 'csv' | 'json' = 'csv'): Promise<void> {
  const params = new URLSearchParams({ startDate, endDate, format });
  const blob = await apiDownload(`/api/v1/audit/export?${params}`);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-logs-${startDate}-to-${endDate}.${format}`;
  link.click();
  window.URL.revokeObjectURL(url);
}
