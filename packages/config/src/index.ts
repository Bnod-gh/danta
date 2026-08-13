export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
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
};

export function assertEnv() {
  const required = [env.databaseUrl, env.jwtSecret, env.jwtRefreshSecret];
  const missing = required.filter((v) => !v || v === 'change-me');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
