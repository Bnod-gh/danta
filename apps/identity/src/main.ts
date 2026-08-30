import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { env, assertEnv } from '@danta/config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

assertEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.setGlobalPrefix('api/v1');
  app.use((req: Request, res: Response, next: NextFunction) => new CorrelationIdMiddleware().use(req, res, next));
  app.use((req: Request, res: Response, next: NextFunction) => new SecurityHeadersMiddleware().use(req, res, next));
  app.enableCors({ origin: env.corsOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalPipes(new ZodValidationPipe());

  app.connectMicroservice({
    transport: 'Tcp',
    options: { host: '0.0.0.0', port: 4002 },
  });

  await app.startAllMicroservices();
  await app.listen(3002, '0.0.0.0');
  console.log(`Identity service HTTP listening on :3002`);
  console.log(`Identity service TCP microservice listening on :4002`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
