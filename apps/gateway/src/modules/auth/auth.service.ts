import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { env } from '@danta/config';

@Injectable()
export class AuthService {
  private readonly identityUrl = env.identityUrl;
  private readonly apiUrl = env.apiUrl;

  async login(req: Request, body: { email: string; password: string; mfaCode?: string }) {
    return this.forwardToIdentity(req, 'POST', '/api/v1/auth/login', body);
  }

  async register(req: Request, body: { email: string; password: string; firstName: string; lastName: string }) {
    return this.forwardToIdentity(req, 'POST', '/api/v1/auth/register', body);
  }

  async refresh(req: Request, body: { refreshToken: string }) {
    return this.forwardToIdentity(req, 'POST', '/api/v1/auth/refresh', body);
  }

  async logout(req: Request, _user: any, body: { refreshToken: string }) {
    return this.forwardToIdentity(req, 'POST', '/api/v1/auth/logout', body);
  }

  async validateApiKey(secret: string) {
    const correlationId = crypto.randomUUID();
    const response = await fetch(`${this.apiUrl}/api/v1/auth/validate-api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify({ secret }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<{ id: string; tenantId: string; userId: string; scopes: string[]; env: string; type: 'api-key' } | null>;
  }

  private async forwardToIdentity(req: Request, method: string, path: string, body: any) {
    const correlationId = (req as any).correlationId || req.headers['x-correlation-id'] || crypto.randomUUID();

    const response = await fetch(`${this.identityUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId as string,
        'x-tenant-id': req.headers['x-tenant-id'] as string,
        'x-user-id': req.headers['x-user-id'] as string,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Service error' }));
      throw new Error(error.message || `Identity service error: ${response.status}`);
    }

    return response.json();
  }
}
