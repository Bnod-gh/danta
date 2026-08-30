import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { env } from '@danta/config';

@Injectable()
export class CorsGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor() {
    const mobileCorsOrigin = (process.env.MOBILE_CORS_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    this.allowedOrigins = [env.corsOrigin, ...mobileCorsOrigin].filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin;

    if (!origin) {
      return true;
    }

    if (this.allowedOrigins.length === 0 || this.allowedOrigins.includes(origin)) {
      return true;
    }

    throw new ForbiddenException('Origin not allowed');
  }
}
