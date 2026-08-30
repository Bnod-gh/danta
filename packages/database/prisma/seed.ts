import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Works under both tsx/CJS and native ESM: seed is always run with
// packages/database as the working directory via pnpm --filter.
const envPath = resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  await seedProcedureCodes();

  const existingOrg = await prisma.organisation.findFirst({ where: { name: 'Danta Demo Dental' } });
  if (existingOrg) {
    console.log('Demo tenant already seeded — refreshing reference catalogue only.');
    await seedClaimIntegrations(existingOrg.id);
    return;
  }

  const org = await prisma.organisation.create({
    data: {
      name: 'Danta Demo Dental',
      status: 'active',
    },
  });

  const practice = await prisma.practice.create({
    data: {
      tenantId: org.id,
      organisationId: org.id,
      name: 'Adelaide CBD',
      status: 'active',
    },
  });

  const location = await prisma.location.create({
    data: {
      tenantId: org.id,
      practiceId: practice.id,
      name: 'Main Clinic',
      address: '123 King William St, Adelaide SA 5000',
      phone: '08 8223 4567',
      timezone: 'Australia/Adelaide',
      status: 'active',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const owner = await prisma.user.create({
    data: {
      tenantId: org.id,
      organisationId: org.id,
      practiceId: practice.id,
      locationId: location.id,
      email: 'ghbinod1991@gmail.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Owner',
      role: 'superadmin',
      status: 'active',
    },
  });

  const dentist = await prisma.user.create({
    data: {
      tenantId: org.id,
      organisationId: org.id,
      practiceId: practice.id,
      locationId: location.id,
      email: 'dentist@danta.demo',
      passwordHash,
      firstName: 'John',
      lastName: 'Dentist',
      role: 'dentist',
      status: 'active',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      tenantId: org.id,
      organisationId: org.id,
      practiceId: practice.id,
      locationId: location.id,
      email: 'reception@danta.demo',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Reception',
      role: 'receptionist',
      status: 'active',
    },
  });

  console.log({ org, practice, location, owner, dentist, receptionist });

  await seedClaimIntegrations(org.id);
}

const CDT_CATALOGUE = [
  { code: 'D0120', description: 'Periodic oral examination', category: 'Diagnostic', defaultFee: 65 },
  { code: 'D0140', description: 'Limited oral evaluation — problem focus', category: 'Diagnostic', defaultFee: 95 },
  { code: 'D0150', description: 'Comprehensive oral evaluation', category: 'Diagnostic', defaultFee: 120 },
  { code: 'D0210', description: 'Intraoral — complete series of radiographic images', category: 'Diagnostic', defaultFee: 180 },
  { code: 'D0272', description: 'Bitewings — two radiographic images', category: 'Diagnostic', defaultFee: 75 },
  { code: 'D0274', description: 'Bitewings — four radiographic images', category: 'Diagnostic', defaultFee: 110 },
  { code: 'D0330', description: 'Panoramic radiographic image', category: 'Diagnostic', defaultFee: 150 },
  { code: 'D1110', description: 'Prophylaxis — adult', category: 'Preventive', defaultFee: 180 },
  { code: 'D1120', description: 'Prophylaxis — child', category: 'Preventive', defaultFee: 130 },
  { code: 'D1206', description: 'Topical application of fluoride varnish', category: 'Preventive', defaultFee: 70 },
  { code: 'D1351', description: 'Pit and fissure sealant — per tooth', category: 'Preventive', defaultFee: 85 },
  { code: 'D2140', description: 'Amalgam restoration — one surface', category: 'Restorative', defaultFee: 195 },
  { code: 'D2391', description: 'Composite restoration — one surface', category: 'Restorative', defaultFee: 200 },
  { code: 'D2392', description: 'Composite restoration — two surfaces', category: 'Restorative', defaultFee: 220 },
  { code: 'D2740', description: 'Crown — porcelain/ceramic', category: 'Restorative', defaultFee: 1250 },
  { code: 'D2750', description: 'Crown — porcelain fused to metal', category: 'Restorative', defaultFee: 1150 },
  { code: 'D2962', description: 'Veneer restoration — lab fabricated', category: 'Restorative', defaultFee: 900 },
  { code: 'D3310', description: 'Endodontic therapy — anterior tooth', category: 'Endodontics', defaultFee: 750 },
  { code: 'D3320', description: 'Endodontic therapy — bicuspid tooth', category: 'Endodontics', defaultFee: 850 },
  { code: 'D3330', description: 'Endodontic therapy — molar', category: 'Endodontics', defaultFee: 950 },
  { code: 'D6010', description: 'Surgical placement of implant body', category: 'Implants', defaultFee: 3500 },
  { code: 'D6057', description: 'Custom fabricated abutment', category: 'Implants', defaultFee: 980 },
  { code: 'D6058', description: 'Abutment-supported porcelain/ceramic crown', category: 'Implants', defaultFee: 1450 },
  { code: 'D7140', description: 'Extraction — erupted tooth or exposed root', category: 'Oral Surgery', defaultFee: 250 },
  { code: 'D7210', description: 'Surgical removal of erupted tooth', category: 'Oral Surgery', defaultFee: 420 },
  { code: 'D8080', description: 'Comprehensive orthodontic treatment — adolescent', category: 'Orthodontics', defaultFee: 7500 },
  { code: 'D9944', description: 'Occlusal guard — hard appliance, per arch', category: 'Adjunctive', defaultFee: 480 },
  { code: 'D9972', description: 'Adjustment of complete denture — mandibular', category: 'Adjunctive', defaultFee: 95 },
];

async function seedProcedureCodes() {
  for (const entry of CDT_CATALOGUE) {
    await prisma.procedure_codes.upsert({
      where: { code: entry.code },
      update: { description: entry.description, category: entry.category, defaultFee: entry.defaultFee },
      create: entry,
    });
  }
  console.log(`Seeded ${CDT_CATALOGUE.length} procedure codes.`);
}

async function seedClaimIntegrations(tenantId: string) {
  const defaults = [
    { name: 'HICAPS Go', provider: 'hicaps' },
    { name: 'DVA Claims', provider: 'dva' },
    { name: 'Medicare EPC', provider: 'medicare' },
  ];
  for (const integration of defaults) {
    const existing = await prisma.claimIntegration.findFirst({ where: { tenantId, name: integration.name } });
    if (!existing) {
      await prisma.claimIntegration.create({ data: { tenantId, ...integration, isActive: true } });
    }
  }
  console.log('Seeded claim integrations.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
