import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = (req as any).correlationId;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const { statusCode } = context.switchToHttp().getResponse();
        const responseTime = Date.now() - now;
        console.log({
          correlationId,
          method: req.method,
          url: req.url,
          statusCode,
          responseTimeMs: responseTime,
        });
      }),
    );
  }
}
