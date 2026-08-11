import { Module } from '@nestjs/common';
import { PeriodontalRecordsService } from './periodontal-records.service';
import { PeriodontalRecordsController } from './periodontal-records.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PeriodontalRecordsController],
  providers: [PeriodontalRecordsService],
  exports: [PeriodontalRecordsService],
})
export class PeriodontalRecordsModule {}
