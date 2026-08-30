import { Queue, Worker } from 'bullmq';
import cron from 'node-cron';
import { createRedisConnection } from '../redis';
import database from '@danta/database';
import type { Db } from '@danta/database';
import { env } from '@danta/config';
import { getEmailProvider, getSmsProvider } from '../providers/sms.factory';

// tsx runs this app as native ESM; the workspace database package ships a CJS
// dist whose star re-exports aren't statically detectable by Node's named
// export detection, so pull members off the default binding at runtime.
type DatabaseModule = typeof import('@danta/database');
// Under ESM-import-of-CJS, `default` carries the module.exports; the real
// PrismaClient lives on `.default` (or the namespace itself under CJS hosts).
const prisma: DatabaseModule['prisma'] =
  (database as unknown as DatabaseModule).default ?? (database as unknown as DatabaseModule);
const runRecallScan = (database as unknown as DatabaseModule).runRecallScan;

const connection = createRedisConnection();

export const recallsQueue = new Queue('recalls', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-recalls';

interface RecallNotifyJobData {
  recallId: string;
}

function buildRecallMessage(patientName: string, typeName: string, dueDate: Date, clinicName: string): string {
  return `Hi ${patientName}, you are due for your ${typeName} at ${clinicName}. Your recall was due on ${dueDate.toLocaleDateString('en-AU')}. Please call us or book online to schedule your visit.`;
}

async function processRecallNotifyJob(job: any): Promise<{ status: string }> {
  const { recallId } = job.data as RecallNotifyJobData;

  const recall = await prisma.recall.findFirst({ where: { id: recallId } });
  if (!recall) throw new Error(`Recall ${recallId} not found`);

  if (['booked', 'completed', 'cancelled', 'failed'].includes(recall.status)) {
    return { status: 'skipped_terminal_status' };
  }

  const maxContacts = env.recallMaxContacts;
  if (recall.contactCount >= maxContacts) {
    return { status: 'max_contacts_reached' };
  }

  const cooldownMs = env.recallContactCooldownDays * 24 * 60 * 60 * 1000;
  if (recall.lastContactAt && Date.now() - new Date(recall.lastContactAt).getTime() < cooldownMs) {
    return { status: 'cooldown_active' };
  }

  const patient = await prisma.patient.findFirst({
    where: { id: recall.patientId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  if (!patient) throw new Error(`Patient ${recall.patientId} not found`);

  const preferences = await prisma.communicationPreference.findFirst({
    where: { tenantId: recall.tenantId, patientId: patient.id },
  });

  const config = await prisma.recall_type_configs.findFirst({
    where: { tenantId: recall.tenantId, type: recall.type },
  });
  const channel = (config?.channel ?? 'sms') as 'sms' | 'email' | 'both';

  const organisation = await prisma.organisation.findFirst({
    where: { id: recall.tenantId },
    select: { name: true },
  });
  const clinicName = organisation?.name ?? 'your dental practice';
  const typeName = recall.type === 'hygiene' ? 'hygiene appointment (clean)' : recall.type.replace(/_/g, ' ').toLowerCase();
  const body = buildRecallMessage(patient.firstName, typeName, recall.dueDate, clinicName);

  const wantEmail = channel !== 'sms';
  const wantSms = channel !== 'email';

  if (wantEmail && !preferences?.emailEnabled && preferences) {
    // respect opt-out
  } else if (wantEmail && patient.email) {
    await getEmailProvider().sendEmail({
      to: patient.email,
      subject: `${clinicName}: recall reminder`,
      body,
      patientId: patient.id,
      tenantId: recall.tenantId,
    });
  }

  if (wantSms && !preferences?.smsEnabled && preferences) {
    // respect opt-out
  } else if (wantSms && patient.phone) {
    const result = await getSmsProvider().sendSms({
      to: patient.phone,
      body,
      patientId: patient.id,
      tenantId: recall.tenantId,
    });
    if (!result.success && result.error?.includes('not configured')) {
      console.warn(`[recalls] SMS skipped for recall ${recallId}: ${result.error}`);
    }
  }

  await prisma.recall.update({
    where: { id: recall.id },
    data: {
      contactCount: { increment: 1 },
      lastContactAt: new Date(),
    },
  });

  return { status: 'contacted' };
}

async function moveToDeadLetter(job: any): Promise<void> {
  const deadLetterQueue = new Queue(DEAD_LETTER_QUEUE, { connection });
  await deadLetterQueue.add('recall-notify-dead', job.data);
  await deadLetterQueue.close();
}

export function createRecallsWorker(): Worker {
  const worker = new Worker('recalls', async (job) => {
    if (job.name !== 'notify:recall') {
      return { status: `ignored_job_${job.name}` };
    }
    try {
      return await processRecallNotifyJob(job);
    } catch (error) {
      if ((job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 1) - 1) {
        await moveToDeadLetter(job);
      }
      throw error;
    }
  }, { connection });

  worker.on('completed', (job) => console.log(`[recalls] job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[recalls] job ${job?.id} failed:`, err.message));

  return worker;
}

/**
 * Hourly scheduler: runs the recall generation scan, then enqueues contact
 * jobs for every recall currently due/overdue that still has contact budget.
 */
export function startRecallScheduler(): void {
  const run = async () => {
    try {
      const result = await runRecallScan(prisma as unknown as Db);
      if (result.created > 0) {
        console.log(`[recalls] scan created ${result.created} recalls across ${result.tenantsScanned} tenants`);
        for (const created of result.recalls) {
          const generated = await prisma.recall.findFirst({
            where: {
              tenantId: created.tenantId,
              patientId: created.patientId,
              type: created.type as never,
              status: 'due',
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          });
          if (generated) {
            await recallsQueue.add('notify:recall', { recallId: generated.id } satisfies RecallNotifyJobData);
          }
        }
      }

      const dueRecalls = await prisma.recall.findMany({
        where: {
          status: { in: ['due', 'overdue'] },
          contactCount: { lt: env.recallMaxContacts },
          OR: [
            { lastContactAt: null },
            { lastContactAt: { lte: new Date(Date.now() - env.recallContactCooldownDays * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { id: true },
        take: 200,
      });

      for (const recall of dueRecalls) {
        await recallsQueue.add('notify:recall', { recallId: recall.id } satisfies RecallNotifyJobData);
      }

      if (dueRecalls.length > 0) {
        console.log(`[recalls] enqueued ${dueRecalls.length} recall contact jobs`);
      }
    } catch (error) {
      console.error('[recalls] scheduled scan failed:', error);
    }
  };

  cron.schedule(env.recallScanCron, () => void run());
  // Run one scan shortly after boot so dev environments see the engine working.
  setTimeout(() => void run(), 15_000);
}
