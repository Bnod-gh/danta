import 'dotenv/config';

import { resolve } from 'node:path';
import dotenv from 'dotenv';

// Filtered pnpm scripts run from an app directory, while the shared env file
// lives at the workspace root. Load a local file first, then fill in values
// from the workspace file without overriding local settings.
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  practicePort: parseInt(process.env.PRACTICE_PORT ?? '3003', 10),
  identityUrl: process.env.IDENTITY_URL ?? 'http://localhost:3002',
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtExpiry: process.env.JWT_EXPIRY ?? '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  mfaIssuer: process.env.MFA_ISSUER ?? 'Danta',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  apiKeyEnv: (process.env.API_KEY_ENV ?? 'development') as 'DEV' | 'STAGING' | 'PROD',
  trustedProxies: (process.env.TRUSTED_PROXIES ?? '10.0.0.0/8,172.16.0.0/12,192.168.0.0/16').split(',').map((s) => s.trim()),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM ?? 'noreply@danta.com',
  smtpSecure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
  minioEndpoint: process.env.STORAGE_S3_ENDPOINT ?? 'http://localhost:9000',
  minioRegion: process.env.STORAGE_S3_REGION ?? 'us-east-1',
  minioAccessKey: process.env.STORAGE_S3_ACCESS_KEY ?? 'minioadmin',
  minioSecretKey: process.env.STORAGE_S3_SECRET_KEY ?? 'minioadmin',
  minioBucket: process.env.STORAGE_S3_BUCKET ?? 'danta-storage',
  minioPublicUrl: process.env.STORAGE_S3_PUBLIC_URL ?? 'http://localhost:9000',
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  storageLocalPath: process.env.STORAGE_LOCAL_PATH ?? 'storage',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
  recallScanCron: process.env.RECALL_SCAN_CRON ?? '15 * * * *',
  recallMaxContacts: parseInt(process.env.RECALL_MAX_CONTACTS ?? '3', 10),
  recallContactCooldownDays: parseInt(process.env.RECALL_CONTACT_COOLDOWN_DAYS ?? '6', 10),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
};

export function assertEnv() {
  const required = {
    DATABASE_URL: env.databaseUrl,
    JWT_SECRET: env.jwtSecret,
    JWT_REFRESH_SECRET: env.jwtRefreshSecret,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value || value === 'change-me')
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (env.nodeEnv === 'production') {
    const unsafe = [
      env.jwtSecret === 'change-me-in-production-use-a-strong-secret',
      env.jwtRefreshSecret === 'change-me-in-production-use-a-strong-secret',
      env.minioAccessKey === 'minioadmin',
      env.minioSecretKey === 'minioadmin',
    ];
    if (unsafe.some(Boolean)) throw new Error('Unsafe development credentials are configured for production');
  }
}
