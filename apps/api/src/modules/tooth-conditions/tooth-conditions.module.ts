import { Module } from '@nestjs/common';
import { ToothConditionsService } from './tooth-conditions.service';
import { ToothConditionsController } from './tooth-conditions.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ToothConditionsController],
  providers: [ToothConditionsService],
  exports: [ToothConditionsService],
})
export class ToothConditionsModule {}
