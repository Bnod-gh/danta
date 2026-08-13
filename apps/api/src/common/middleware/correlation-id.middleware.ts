import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
    const correlationId = Array.isArray(existingId) ? existingId[0] : existingId || uuidv4();
    
    req.headers['x-correlation-id'] = correlationId;
    (req as any).correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    
    next();
  }
}
