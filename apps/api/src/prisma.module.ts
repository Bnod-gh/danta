import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const PRISMA_SERVICE = 'PRISMA_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_SERVICE,
      useExisting: PrismaService,
    },
    PrismaService,
  ],
  exports: [PRISMA_SERVICE, PrismaService],
})
export class PrismaModule {}
