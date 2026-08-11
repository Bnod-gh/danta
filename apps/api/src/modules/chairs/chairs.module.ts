import { Module } from '@nestjs/common';
import { ChairsService } from './chairs.service';
import { ChairsController } from './chairs.controller';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ChairsController],
  providers: [ChairsService],
  exports: [ChairsService],
})
export class ChairsModule {}
