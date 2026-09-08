import { Module } from '@nestjs/common';
import { ToothConditionConfigsService } from './tooth-condition-configs.service';
import { ToothConditionConfigsController } from './tooth-condition-configs.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ToothConditionConfigsController],
  providers: [ToothConditionConfigsService],
  exports: [ToothConditionConfigsService],
})
export class ToothConditionConfigsModule {}
