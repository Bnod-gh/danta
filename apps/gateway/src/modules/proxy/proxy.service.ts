import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { env } from '@danta/config';
import { CircuitBreaker } from '../../common/circuit-breaker';
import * as http from 'http';
import * as https from 'https';
import { Readable } from 'stream';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly failureThreshold = Number(process.env.GATEWAY_CIRCUIT_FAILURE_THRESHOLD || 5);
  private readonly resetTimeoutMs = Number(process.env.GATEWAY_CIRCUIT_RESET_TIMEOUT_MS || 30_000);

  private readonly identityUrl = env.identityUrl;
  private readonly practiceUrl = 'http://localhost:3003';
  private readonly monolithUrl = 'http://localhost:3001';

  private readonly identityPrefixes = [
    '/users',
    '/sessions',
    '/mfa',
    '/api-keys',
    '/invitations',
    '/password-reset',
    '/email-verification',
  ];

  private readonly apiAuthPrefixes = [
    '/auth/me',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/mfa',
  ];

  private readonly practicePrefixes = [
    '/tenants',
    '/subscriptions',
  ];

  private getBreaker(targetUrl: string): CircuitBreaker {
    const serviceKey = new URL(targetUrl).origin;
    let breaker = this.breakers.get(serviceKey);
    if (!breaker) {
      breaker = new CircuitBreaker({
        failureThreshold: this.failureThreshold,
        resetTimeoutMs: this.resetTimeoutMs,
      });
      this.breakers.set(serviceKey, breaker);
    }
    return breaker;
  }

  async handleRequest(req: Request, res: Response) {
    const path = req.path;
    const method = req.method;

    let targetUrl: string;

    // The current-user endpoint is implemented by the API service because it
    // also loads tenant, practice, location, and permissions data.
    const isApiAuthRequest = this.apiAuthPrefixes.some((prefix) => path.startsWith(`/api/v1${prefix}`));

    if (isApiAuthRequest) {
      targetUrl = `${this.monolithUrl}${path}`;
    } else if (this.identityPrefixes.some((prefix) => path.startsWith(`/api/v1${prefix}`))) {
      targetUrl = `${this.identityUrl}${path}`;
    } else if (this.practicePrefixes.some((prefix) => path.startsWith(`/api/v1${prefix}`))) {
      targetUrl = `${this.practiceUrl}${path}`;
    } else {
      targetUrl = `${this.monolithUrl}${path}`;
    }

    const breaker = this.getBreaker(targetUrl);
    if (!breaker.canRequest()) {
      res.status(503).json({
        statusCode: 503,
        message: 'Service temporarily unavailable',
        correlationId: (req as any).correlationId,
      });
      return;
    }

    const queryString = req.url.split('?')[1] || '';

    const headers: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: new URL(targetUrl).host,
      'x-correlation-id': ((req as any).correlationId || req.headers['x-correlation-id']) as string,
    };

    // Nest's default body parser consumes the request stream before this handler
    // runs. When that happened, re-materialize the parsed body so the upstream
    // receives the bytes its Content-Length promises; otherwise pipe untouched.
    let bodySource: Readable = req;
    const contentType = String(req.headers['content-type'] ?? '');
    if (req.readableEnded) {
      if (contentType.includes('application/json')) {
        const payload = JSON.stringify(req.body ?? {});
        if (headers['transfer-encoding']) delete headers['transfer-encoding'];
        headers['content-length'] = String(Buffer.byteLength(payload));
        bodySource = Readable.from([payload]);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const payload = new URLSearchParams(req.body ?? {}).toString();
        if (headers['transfer-encoding']) delete headers['transfer-encoding'];
        headers['content-length'] = String(Buffer.byteLength(payload));
        bodySource = Readable.from([payload]);
      }
    }

    const proxyReq = (targetUrl.startsWith('https') ? https : http).request(
      targetUrl + (queryString ? `?${queryString}` : ''),
      {
        method,
        headers,
      },
      (proxyRes) => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 500) {
          breaker.recordFailure();
        } else {
          breaker.recordSuccess();
        }
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );

    proxyReq.setTimeout(15_000, () => {
      proxyReq.destroy(new Error('Upstream service timed out'));
    });

    proxyReq.on('error', (error) => {
      breaker.recordFailure();
      this.logger.error(`Proxy error: ${error.message}`);
      if (!res.headersSent) {
        res.status(503).json({
          statusCode: 503,
          message: 'Service unavailable',
          correlationId: (req as any).correlationId,
        });
      }
    });

    bodySource.pipe(proxyReq, { end: true });
  }
}
