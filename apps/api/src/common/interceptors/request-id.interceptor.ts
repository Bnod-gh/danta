import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService, LogMetadata } from '../logger/logger.service';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    let requestId = request.headers['x-request-id'] || request.headers['x-correlation-id'];
    if (!requestId) {
      requestId = uuidv4();
    }

    if (Array.isArray(requestId)) {
      requestId = requestId[0];
    }

    request.headers['x-request-id'] = requestId;
    (request as any).requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const method = request.method;
    const url = request.url;

    const startMetadata: LogMetadata = {
      requestId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    this.logger.info(`Request started: ${method} ${url}`, 'RequestLogger', startMetadata);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const endMetadata: LogMetadata = {
            requestId,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          };
          this.logger.info(`Request completed: ${method} ${url}`, 'RequestLogger', endMetadata);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const errorMetadata: LogMetadata = {
            requestId,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
          this.logger.error(`Request failed: ${method} ${url}`, 'RequestLogger', errorMetadata);
        },
      }),
    );
  }
}
