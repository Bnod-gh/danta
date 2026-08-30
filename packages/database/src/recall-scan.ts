import type { RecallStatus, RecallType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface Db {
  organisation: { findMany: (args?: unknown) => Promise<Array<{ id: string }>> };
  recall_type_configs: {
    findMany: (args?: unknown) => Promise<Array<{ tenantId: string; type: string; intervalDays: number; isActive: boolean }>>;
    findFirst: (args?: unknown) => Promise<unknown>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  recall: { findFirst: (args?: unknown) => Promise<unknown>; create: (args: { data: Record<string, unknown> }) => Promise<unknown> };
  appointment: { groupBy: (args?: unknown) => Promise<Array<{ patientId: string; _max: { startTime: Date } }>> };
  $transaction: (fn: (db: Db) => Promise<unknown>) => Promise<unknown>;
}

export const DEFAULT_RECALL_INTERVALS: Record<string, number> = {
  examination: 365,
  hygiene: 180,
  periodontal: 90,
  xray: 730,
  treatment_followup: 14,
};

const AUTO_SCAN_TYPES = ['examination', 'hygiene', 'periodontal', 'xray'] as const;
const ACTIVE_RECALL_STATUSES: RecallStatus[] = ['pending', 'due', 'overdue', 'booked'];

export interface CreatedRecall {
  tenantId: string;
  patientId: string;
  type: string;
  dueDate: Date;
  lastVisit: Date;
}

export interface RecallScanResult {
  scannedAt: string;
  tenantsScanned: number;
  created: number;
  recalls: CreatedRecall[];
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Ensures every (or one scoped) tenant has a config row per recall type, seeding product defaults. */
export async function ensureRecallConfigs(db: Db, scopeTenantId?: string): Promise<number> {
  const tenants = await db.organisation.findMany({
    where: scopeTenantId ? { id: scopeTenantId } : undefined,
    select: { id: true },
  });
  let created = 0;
  for (const tenant of tenants) {
    for (const [type, intervalDays] of Object.entries(DEFAULT_RECALL_INTERVALS)) {
      const existing = await db.recall_type_configs.findFirst({
        where: { tenantId: tenant.id, type: type as unknown as RecallType },
        select: { id: true },
      });
      if (!existing) {
        await db.recall_type_configs.create({
          data: { id: randomUUID(), tenantId: tenant.id, type: type as RecallType, intervalDays, updatedAt: new Date() },
        });
        created += 1;
      }
    }
  }
  return created;
}

/**
 * Recall engine: for each active recall-type config, find patients whose most
 * recent completed appointment is older than the configured interval and who
 * have no active recall of that type; create a `due` recall for each.
 *
 * Pass `scopeTenantId` to restrict the run to one tenant (staff-triggered
 * scans); omit it for the nightly worker sweep across all tenants.
 */
export async function runRecallScan(db: Db, now: Date = new Date(), scopeTenantId?: string): Promise<RecallScanResult> {
  const tenants = await db.organisation.findMany({
    where: scopeTenantId ? { id: scopeTenantId } : undefined,
    select: { id: true },
  });
  const recalls: CreatedRecall[] = [];

  for (const tenant of tenants) {
    const configs = await db.recall_type_configs.findMany({
      where: { tenantId: tenant.id, isActive: true, type: { in: [...AUTO_SCAN_TYPES] } },
    });

    for (const config of configs) {
      const cutoff = addDays(now, -config.intervalDays);
      const completed = await db.appointment.groupBy({
        by: ['patientId'],
        where: {
          tenantId: tenant.id,
          status: 'completed',
        },
        _max: { startTime: true },
      });

      for (const entry of completed) {
        const lastVisit = entry._max.startTime;
        if (!lastVisit || lastVisit > cutoff) continue;

        const hasActiveRecall = await db.recall.findFirst({
          where: {
            tenantId: tenant.id,
            patientId: entry.patientId,
            type: config.type,
            status: { in: ACTIVE_RECALL_STATUSES },
          },
          select: { id: true },
        });
        if (hasActiveRecall) continue;

        const created = await db.recall.create({
          data: {
            tenantId: tenant.id,
            patientId: entry.patientId,
            type: config.type,
            status: 'due',
            dueDate: addDays(lastVisit, config.intervalDays),
            notes: `Auto-generated from recall schedule (${config.intervalDays}d since ${lastVisit.toISOString().slice(0, 10)})`,
          },
        });
        void created;
        recalls.push({
          tenantId: tenant.id,
          patientId: entry.patientId,
          type: config.type,
          dueDate: addDays(lastVisit, config.intervalDays),
          lastVisit,
        });
      }
    }
  }

  return {
    scannedAt: now.toISOString(),
    tenantsScanned: tenants.length,
    created: recalls.length,
    recalls,
  };
}
