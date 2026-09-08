import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Backfill script for the clinical-module migration.
//
// The ToothCondition model gained `clinicalModule` / `clinicalStatus` columns, but
// pre-existing findings were created before the module system existed. This script
// derives a sensible module + lifecycle status from the legacy `condition` / `status`
// fields so historical charts remain coherent inside the new module-aware UI.
//
// Run with: pnpm --filter database exec tsx prisma/backfill-clinical-module.ts
// Set BACKFILL_DRY_RUN=1 to report counts without writing.

const envPath = resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

/** Map a legacy dental condition to the clinical module most likely responsible for it. */
const CONDITION_TO_MODULE: Record<string, string> = {
  caries: 'odontogram_diagnosis',
  missing: 'odontogram_diagnosis',
  extraction: 'odontogram_surgery',
  filling: 'odontogram_restorative',
  crown: 'odontogram_restorative',
  veneer: 'odontogram_restorative',
  root_canal: 'odontogram_endodontics',
  implant: 'odontogram_surgery',
};

const STATUS_TO_CLINICAL: Record<string, string> = {
  planned: 'planned',
  existing: 'existing',
  watch: 'diagnosed',
};

function deriveModule(condition: string): string {
  return CONDITION_TO_MODULE[condition] ?? 'odontogram_diagnosis';
}

async function main() {
  const dryRun = process.env.BACKFILL_DRY_RUN === '1';
  const total = await prisma.toothCondition.count({ where: { clinicalModule: null } });
  console.log(`ToothConditions missing clinicalModule: ${total}${dryRun ? ' (DRY RUN)' : ''}`);

  if (total === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  if (dryRun) {
    const sample = await prisma.toothCondition.findMany({
      where: { clinicalModule: null },
      select: { id: true, condition: true, status: true },
      take: 20,
    });
    for (const row of sample) {
      console.log(`  ${row.id} -> module=${deriveModule(row.condition)} status=${STATUS_TO_CLINICAL[row.status] ?? 'planned'}`);
    }
    return;
  }

  // Process in batches to avoid loading the whole table into memory.
  const BATCH = 500;
  let processed = 0;
  let cursor: string | undefined;

  while (processed < total) {
    const batch = await prisma.toothCondition.findMany({
      where: { clinicalModule: null, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: 'asc' },
      take: BATCH,
    });
    if (batch.length === 0) break;

    for (const row of batch) {
      await prisma.toothCondition.update({
        where: { id: row.id },
        data: {
          clinicalModule: deriveModule(row.condition),
          ...(STATUS_TO_CLINICAL[row.status]
            ? { clinicalStatus: STATUS_TO_CLINICAL[row.status] }
            : {}),
        },
      });
    }

    processed += batch.length;
    cursor = batch[batch.length - 1].id;
    console.log(`  backfilled ${processed}/${total}`);
  }

  console.log(`Backfill complete: ${processed} findings updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
