import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const MAX_BODY_BYTES = 10 * 1024 * 1024;

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const contentLength = req.headers['content-length'];

    if (contentLength !== undefined) {
      const size = parseInt(contentLength as string, 10);

      if (!Number.isNaN(size) && size > MAX_BODY_BYTES) {
        res.status(413).json({
          statusCode: 413,
          message: 'Payload too large',
          error: 'Payload Too Large',
        });
        return;
      }
    }

    next();
  }
}
