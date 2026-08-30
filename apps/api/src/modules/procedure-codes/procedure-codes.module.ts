import { Module } from '@nestjs/common';
import { ProcedureCodesService } from './procedure-codes.service';
import { ProcedureCodesController } from './procedure-codes.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProcedureCodesController],
  providers: [ProcedureCodesService],
})
export class ProcedureCodesModule {}
