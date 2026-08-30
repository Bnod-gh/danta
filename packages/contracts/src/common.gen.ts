export interface CorrelationId {
  value: string;
}

export interface RequestId {
  value: string;
}

export interface TenantContext {
  tenantId: string;
  practiceId?: string;
  locationId?: string;
}

export interface AuthenticatedIdentity {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  type: 'user' | 'api-key';
  scopes?: string[];
}

export interface ServiceError {
  code: string;
  message: string;
  correlationId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
}

export interface Practice {
  id: string;
  tenantId: string;
  name: string;
  status: string;
}

export interface Setting {
  id: string;
  tenantId: string;
  key: string;
  valueJson: string;
}
