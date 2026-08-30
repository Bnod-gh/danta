import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { env, assertEnv } from '@danta/config';
import { SwaggerModuleSetup } from './modules/swagger/swagger.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';

assertEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.use('/storage', express.static(join(process.cwd(), env.storageLocalPath)));
  app.use((req: Request, res: Response, next: NextFunction) => new CorrelationIdMiddleware().use(req, res, next));
  app.use((req: Request, res: Response, next: NextFunction) => new SecurityHeadersMiddleware().use(req, res, next));
  app.enableCors({ origin: env.corsOrigin, credentials: true });
  // ZodValidationPipe handles both DTO class-validation and Zod schemas; no need for ValidationPipe.
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  SwaggerModuleSetup.setup(app);
  await app.listen(env.port, '0.0.0.0');
  console.log(`API listening on :${env.port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
