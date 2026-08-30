import type { AuthenticatedIdentity } from './common.gen';

export interface ValidateTokenRequest {
  token: string;
}

export interface ValidateTokenResponse {
  identity: AuthenticatedIdentity;
  valid: boolean;
}

export interface ValidateApiKeyRequest {
  secret: string;
  correlationId?: string;
}

export interface ValidateApiKeyResponse {
  identity: AuthenticatedIdentity;
  valid: boolean;
}

export interface CheckPermissionRequest {
  userId: string;
  permission: string;
  tenantId: string;
}

export interface CheckPermissionResponse {
  allowed: boolean;
}

export interface GetUserRequest {
  userId: string;
  tenantId: string;
}

export interface GetUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
  status: string;
  found: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
  status: string;
}

export interface CreateUserRequest {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role: string;
  practiceId?: string;
  locationId?: string;
}

export interface CreateUserResponse {
  user: UserResponse;
}
