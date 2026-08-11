import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../../../.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Failed to load .env from', envPath, result.error);
}

const prisma = new PrismaClient();

async function main() {
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
      email: 'owner@danta.demo',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Owner',
      role: 'organisation_owner',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
