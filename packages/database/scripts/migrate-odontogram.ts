import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOdontogram() {
  console.log('🚀 Starting Odontogram Data Migration...');

  try {
    // 1. Count records needing migration
    const count = await prisma.toothCondition.count({
      where: {
        clinicalModule: null,
      },
    });

    if (count === 0) {
      console.log('✅ No legacy records found needing migration. Skipping.');
      return;
    }

    console.log(`📦 Found ${count} records with missing clinicalModule. Migrating to 'diagnosis'...`);

    // 2. Perform update in batches to avoid locking large tables
    const batchSize = 500;
    let updatedCount = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await prisma.toothCondition.updateMany({
        where: {
          clinicalModule: null,
        },
        data: {
          clinicalModule: 'diagnosis',
        },
      });

      updatedCount += result.count;

      // check if we still have records to update
      const remaining = await prisma.toothCondition.count({
        where: { clinicalModule: null }
      });

      if (remaining === 0) {
        hasMore = false;
      }

      console.log(`Processed ${updatedCount}/${count}...`);
    }

    console.log(`✅ Successfully migrated ${updatedCount} records to the 'diagnosis' module.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateOdontogram();
