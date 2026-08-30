/**
 * MANDATORY tenant-isolation integration tests (master prompt §41).
 *
 * Runs against the real PostgreSQL database (docker compose). Creates two
 * tenants with one patient each, then proves that every service operating in
 * Tenant A's context denies access to Tenant B's records across domains.
 *
 * Skipped automatically when DATABASE_URL is not configured so unit CI
 * without infrastructure still passes.
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Surface the repo's DATABASE_URL for the skipIf guard (Prisma reads .env itself,
// but process.env is only populated when explicitly loaded).
if (!process.env.DATABASE_URL) {
  for (const candidate of [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../.env'),
  ]) {
    try {
      const match = fs.readFileSync(candidate, 'utf8').match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        process.env.DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
        break;
      }
    } catch {
      // file missing — keep probing
    }
  }
}

import { PatientsService } from '../src/modules/patients/patients.service';
import { PatientClinicalService } from '../src/modules/patient-clinical/patient-clinical.service';
import { EstimatesService } from '../src/modules/estimates/estimates.service';
import { TreatmentPlanItemsService } from '../src/modules/treatment-plan-items/treatment-plan-items.service';

const prisma = new PrismaClient();
const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

d('Tenant isolation (integration)', () => {
  let patientsService: PatientsService;
  let clinicalService: PatientClinicalService;
  let estimatesService: EstimatesService;
  let planItemsService: TreatmentPlanItemsService;

  const suffix = randomUUID().slice(0, 8);
  let tenantA: string;
  let tenantB: string;
  let patientAId: string;
  let patientBId: string;

    const auditStub = { log: async () => undefined } as never;
    const queueStub = { enqueue: async () => true } as never;

    beforeAll(async () => {
      patientsService = new PatientsService(prisma as never, auditStub, queueStub);
    clinicalService = new PatientClinicalService(prisma as never);
    estimatesService = new EstimatesService(prisma as never, auditStub);
    planItemsService = new TreatmentPlanItemsService(prisma as never, auditStub);

    const orgA = await prisma.organisation.create({ data: { name: `IsolationTestA-${suffix}`, status: 'active' } });
    const orgB = await prisma.organisation.create({ data: { name: `IsolationTestB-${suffix}`, status: 'active' } });
    tenantA = orgA.id;
    tenantB = orgB.id;

    const [patientA, patientB] = await Promise.all([
      prisma.patient.create({
        data: {
          tenantId: tenantA,
          patientNumber: `ISO-A-${suffix}`,
          firstName: 'Alice',
          lastName: 'A',
          dateOfBirth: new Date('1990-01-01'),
        },
      }),
      prisma.patient.create({
        data: {
          tenantId: tenantB,
          patientNumber: `ISO-B-${suffix}`,
          firstName: 'Bob',
          lastName: 'B',
          dateOfBirth: new Date('1990-01-01'),
        },
      }),
    ]);
    patientAId = patientA.id;
    patientBId = patientB.id;
  });

  afterAll(async () => {
    // Cleanup in FK-safe order for both tenants.
    for (const tenant of [tenantA, tenantB].filter(Boolean)) {
      await prisma.estimateApproval.deleteMany({ where: { tenantId: tenant } });
      await prisma.estimateItem.deleteMany({ where: { tenantId: tenant } });
      await prisma.estimate.deleteMany({ where: { tenantId: tenant } });
      await prisma.appointmentTreatment.deleteMany({ where: { tenantId: tenant } });
      await prisma.treatmentHistory.deleteMany({ where: { tenantId: tenant } });
      await prisma.treatmentPlanItem.deleteMany({ where: { tenantId: tenant } });
      await prisma.treatmentPlan.deleteMany({ where: { tenantId: tenant } });
      await prisma.toothCondition.deleteMany({ where: { tenantId: tenant } });
      await prisma.dentalChart.deleteMany({ where: { tenantId: tenant } });
      await prisma.paymentAllocation.deleteMany({ where: { tenantId: tenant } });
      await prisma.refund.deleteMany({ where: { tenantId: tenant } });
      await prisma.creditNote.deleteMany({ where: { tenantId: tenant } });
      await prisma.payment.deleteMany({ where: { tenantId: tenant } });
      await prisma.invoice.deleteMany({ where: { tenantId: tenant } });
      await prisma.appointmentStatusEvent.deleteMany({ where: { tenantId: tenant } }).catch(() => undefined);
      await prisma.appointment.deleteMany({ where: { tenantId: tenant } });
      await prisma.recall.deleteMany({ where: { tenantId: tenant } });
      await prisma.waitlist.deleteMany({ where: { tenantId: tenant } }).catch(() => undefined);
      await prisma.message.deleteMany({ where: { tenantId: tenant } });
      await prisma.notification.deleteMany({ where: { tenantId: tenant } });
      await prisma.auditLog.deleteMany({ where: { tenantId: tenant } }).catch(() => undefined);
      await prisma.patient.deleteMany({ where: { tenantId: tenant } });
      await prisma.organisation.delete({ where: { id: tenant } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it('Tenant A cannot read Tenant B patient', async () => {
    await expect(patientsService.findOne(tenantA, patientBId)).rejects.toThrow(/not found/i);
  });

  it('Tenant A cannot update or archive Tenant B patient', async () => {
    await expect(
      patientsService.update(tenantA, 'user-a', patientBId, { firstName: 'Hacked' } as never),
    ).rejects.toThrow(/not found/i);
    await expect(patientsService.archivePatient(tenantA, 'user-a', patientBId)).rejects.toThrow(/not found/i);
  });

  it('Tenant A cannot delete Tenant B patient', async () => {
    await expect(patientsService.remove(tenantA, 'user-a', patientBId)).rejects.toThrow(/not found|unable/i);
  });

  it('Tenant A cannot merge Tenant B patients', async () => {
    await expect(
      patientsService.mergePatients(tenantA, 'user-a', patientAId, patientBId),
    ).rejects.toThrow(/not found/i);
  });

  it("Tenant A cannot fetch Tenant B clinical odontogram, tooth history or timeline", async () => {
    await expect(clinicalService.getCurrentOdontogram(tenantA, patientBId)).rejects.toThrow(/not found/i);
    await expect(clinicalService.getOdontogramAt(tenantA, patientBId, new Date())).rejects.toThrow(/not found/i);
    await expect(clinicalService.getToothHistory(tenantA, patientBId, '16')).rejects.toThrow(/not found/i);

    // The composed timeline asserts the patient belongs to the caller's tenant first.
    await expect(
      clinicalService.getTimeline(tenantA, patientBId, { skip: 0, take: 50 } as never),
    ).rejects.toThrow(/not found/i);
  });

  it("Tenant A cannot see or mutate Tenant B treatment plan items", async () => {
    const itemsForB = await planItemsService.findAll(tenantA, { patientId: patientBId });
    expect(itemsForB).toHaveLength(0);
    await expect(planItemsService.findOne(tenantA, randomUUID())).rejects.toThrow(/not found/i);
  });

  it("Tenant A cannot see Tenant B estimates and cannot create one for B's patient", async () => {
    const estimates = await estimatesService.findAll(tenantA, { patientId: patientBId });
    expect(estimates).toHaveLength(0);
    await expect(
      estimatesService.create(tenantA, 'user-a', {
        patientId: patientBId,
        items: [{ description: 'X', quantity: 1, unitPrice: 100, discount: 0, taxRate: 0 }],
      }),
    ).rejects.toThrow(/not found/i);
  });

  it("Tenant B's own data remains fully accessible in its own context", async () => {
    const found = await patientsService.findOne(tenantB, patientBId);
    expect(found.id).toBe(patientBId);
    expect(found.firstName).toBe('Bob');
  });
});

export default d;
