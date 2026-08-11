import { Module } from '@nestjs/common';
import { RecallsService } from './recalls.service';
import { RecallsController } from './recalls.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RecallsController],
  providers: [RecallsService],
  exports: [RecallsService],
})
export class RecallsModule {}
