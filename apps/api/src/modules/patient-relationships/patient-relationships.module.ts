import { Module } from '@nestjs/common';
import { PatientRelationshipsService } from './patient-relationships.service';
import { PatientRelationshipsController } from './patient-relationships.controller';
import { PrismaModule } from '../../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientRelationshipsController],
  providers: [PatientRelationshipsService],
  exports: [PatientRelationshipsService],
})
export class PatientRelationshipsModule {}
