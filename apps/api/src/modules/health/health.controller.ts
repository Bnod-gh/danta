import { Controller, Get, Res, Header } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../../prisma.service';
import { Response } from 'express';
import { Redis } from 'ioredis';
import { env } from '@danta/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  async checkReadiness() {
    return this.health.check([
      () => this.prisma.$queryRaw`SELECT 1`,
      () => this.checkRedis(),
      () => this.checkExternalServices(),
    ]);
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(@Res() res: Response) {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    const lines = [
      '# HELP danta_process_start_time_seconds Process start time in seconds since epoch',
      '# TYPE danta_process_start_time_seconds gauge',
      `danta_process_start_time_seconds ${Math.floor((Date.now() - uptime * 1000) / 1000)}`,
      '',
      '# HELP danta_process_uptime_seconds Process uptime in seconds',
      '# TYPE danta_process_uptime_seconds gauge',
      `danta_process_uptime_seconds ${uptime.toFixed(3)}`,
      '',
      '# HELP danta_nodejs_heap_size_used_bytes Node.js heap size used in bytes',
      '# TYPE danta_nodejs_heap_size_used_bytes gauge',
      `danta_nodejs_heap_size_used_bytes ${memory.heapUsed}`,
      '',
      '# HELP danta_nodejs_heap_size_total_bytes Node.js heap size total in bytes',
      '# TYPE danta_nodejs_heap_size_total_bytes gauge',
      `danta_nodejs_heap_size_total_bytes ${memory.heapTotal}`,
      '',
      '# HELP danta_nodejs_external_memory_bytes Node.js external memory in bytes',
      '# TYPE danta_nodejs_external_memory_bytes gauge',
      `danta_nodejs_external_memory_bytes ${memory.external}`,
      '',
      '# HELP danta_nodejs_rss_bytes Node.js RSS memory in bytes',
      '# TYPE danta_nodejs_rss_bytes gauge',
      `danta_nodejs_rss_bytes ${memory.rss}`,
      '',
    ];

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(lines.join('\n'));
  }

  private async checkRedis(): Promise<Record<string, { status: 'up' | 'down'; error?: string }>> {
    try {
      const client = new Redis(env.redisUrl);
      await client.ping();
      await client.quit();
      return { danta_redis_status: { status: 'up' } };
    } catch (error) {
      return {
        danta_redis_status: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Redis unavailable',
        },
      };
    }
  }

  private async checkExternalServices(): Promise<Record<string, { status: 'up' | 'down'; error?: string }>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const checks = await Promise.allSettled([
        fetch(env.minioEndpoint, { method: 'HEAD', signal: controller.signal }).catch(() => null),
      ]);

      clearTimeout(timeoutId);

      const result: Record<string, { status: 'up' | 'down'; error?: string }> = {};
      const minioResult = checks[0];
      result['danta_minio_status'] = {
        status: minioResult.status === 'fulfilled' && minioResult.value !== null ? 'up' : 'down',
      };

      return result;
    } catch (error) {
      return {
        danta_minio_status: {
          status: 'down',
          error: error instanceof Error ? error.message : 'External services unavailable',
        },
      };
    }
  }
}
