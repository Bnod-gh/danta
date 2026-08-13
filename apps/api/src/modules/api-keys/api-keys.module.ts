import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ApiKeyScopesGuard } from './guards/api-key-scopes.guard';
import { ApiKeyIpGuard } from './guards/api-key-ip.guard';
import { ApiKeyCacheService } from './services/api-key-cache.service';
import { ApiKeyRateLimitService } from './services/api-key-rate-limit.service';
import { PrismaModule } from '../../prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyAuthGuard, ApiKeyScopesGuard, ApiKeyIpGuard, ApiKeyCacheService, ApiKeyRateLimitService],
  exports: [ApiKeysService, ApiKeyAuthGuard, ApiKeyScopesGuard, ApiKeyIpGuard, ApiKeyCacheService, ApiKeyRateLimitService],
})
export class ApiKeysModule {}
