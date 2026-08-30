import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureRecallConfigs, runRecallScan, DEFAULT_RECALL_INTERVALS, type Db } from './recall-scan';

const NOW = new Date('2026-08-23T00:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function makeDb(overrides: Partial<Record<string, unknown>> = {}) {
  const created: Array<Record<string, unknown>> = [];
  const db = {
    organisation: { findMany: vi.fn().mockResolvedValue([{ id: 'tenant-1' }]) },
    recall_type_configs: {
      findMany: vi.fn().mockResolvedValue([
        { tenantId: 'tenant-1', type: 'hygiene', intervalDays: 180, isActive: true },
        { tenantId: 'tenant-1', type: 'periodontal', intervalDays: 90, isActive: true },
      ]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    appointment: {
      groupBy: vi.fn().mockResolvedValue([
        { patientId: 'p1', _max: { startTime: daysAgo(200) } },
        { patientId: 'p2', _max: { startTime: daysAgo(10) } },
      ]),
    },
    recall: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }) => {
        created.push(data);
        return { id: `recall-${created.length}`, ...data };
      }),
    },
    $transaction: vi.fn(),
    ...overrides,
  };
  return { db: db as unknown as Db, created };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runRecallScan', () => {
  it('creates due recalls only for patients past their interval with no active recall', async () => {
    const { db, created } = makeDb();

    const result = await runRecallScan(db, NOW);

    // p1: hygiene overdue at 200d > 180d ✓; periodontal 200d > 90d ✓
    // p2: 10d since visit — neither interval elapsed ✗
    expect(result.created).toBe(2);
    expect(created.every((r) => r.status === 'due')).toBe(true);
    const hygieneForP1 = created.find((r) => r.patientId === 'p1' && r.type === 'hygiene');
    expect(hygieneForP1).toBeDefined();
  });

  it('skips patients who already have an active recall of the same type', async () => {
    const dbOverrides = {
      recall: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          return where.type === 'hygiene' ? { id: 'existing-hygiene' } : null;
        }),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const { db } = makeDb(dbOverrides);

    const result = await runRecallScan(db, NOW);

    // p1 periodontal still generated; both hygiene generations suppressed
    expect(result.created).toBe(1);
    expect(result.recalls[0].type).toBe('periodontal');
  });

  it('ignores inactive configs and non-auto types', async () => {
    // Simulate Prisma applying isActive/type-in filters server-side:
    const { db } = makeDb({
      recall_type_configs: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      appointment: {
        groupBy: vi.fn().mockResolvedValue([{ patientId: 'p1', _max: { startTime: daysAgo(400) } }]),
      },
    });

    const result = await runRecallScan(db, NOW);
    expect(result.created).toBe(0);
    expect(result.recalls).toEqual([]);
  });
});

describe('ensureRecallConfigs', () => {
  it('creates missing default configs per tenant', async () => {
    const configs: Array<{ type: string }> = [];
    const db = {
      organisation: { findMany: vi.fn().mockResolvedValue([{ id: 't1' }, { id: 't2' }]) },
      recall_type_configs: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => {
          configs.push({ type: data.type as string });
          return data;
        }),
      },
    };

    const created = await ensureRecallConfigs(db as never);

    expect(created).toBe(Object.keys(DEFAULT_RECALL_INTERVALS).length * 2);
    expect(configs.filter((c) => c.type === 'hygiene')).toHaveLength(2);
  });
});

describe('runRecallScan tenant scoping', () => {
  it('restricts the sweep to the requested tenant when scoped', async () => {
    const { db } = makeDb();
    await runRecallScan(db, NOW, 'tenant-9');

    expect(db.organisation.findMany).toHaveBeenCalledWith({
      where: { id: 'tenant-9' },
      select: { id: true },
    });
  });

  it('scans every tenant when unscoped (worker mode)', async () => {
    const { db } = makeDb();
    await runRecallScan(db, NOW);

    expect(db.organisation.findMany).toHaveBeenCalledWith({ select: { id: true } });
  });

  it('scopes ensureRecallConfigs seeding to one tenant', async () => {
    const { db } = makeDb();
    await ensureRecallConfigs(db, 'tenant-9');

    expect(db.organisation.findMany).toHaveBeenCalledWith({
      where: { id: 'tenant-9' },
      select: { id: true },
    });
  });
});
