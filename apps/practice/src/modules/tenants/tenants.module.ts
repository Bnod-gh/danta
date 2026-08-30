import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
