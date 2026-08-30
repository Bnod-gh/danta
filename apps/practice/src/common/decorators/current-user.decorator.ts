import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
  status: string;
  firstName?: string;
  lastName?: string;
}

export interface ApiKeyAuthenticatedUser {
  id: string;
  tenantId: string;
  userId: string;
  scopes: string[];
  env: string;
  ipAllowlist?: string[];
  type: 'api-key';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);

export const ApiKeyCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyAuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as ApiKeyAuthenticatedUser;
  },
);
