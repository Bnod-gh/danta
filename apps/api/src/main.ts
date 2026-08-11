import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { env, assertEnv } from '@danta/config';
import { SwaggerModuleSetup } from './modules/swagger/swagger.module';

assertEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: env.corsOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalPipes(new ZodValidationPipe());
  SwaggerModuleSetup.setup(app);
  app.listen(env.port, '0.0.0.0');
  console.log(`API listening on :${env.port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
