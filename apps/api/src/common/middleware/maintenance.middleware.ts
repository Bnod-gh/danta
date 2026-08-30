import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.MAINTENANCE_MODE === 'true';
  }

  use(_req: Request, res: Response, next: NextFunction): void {
    if (!this.enabled) {
      next();
      return;
    }

    res.setHeader('Retry-After', '3600');
    res.status(503).json({
      statusCode: 503,
      message: 'Service is temporarily unavailable due to maintenance',
      error: 'Service Unavailable',
    });
  }
}
