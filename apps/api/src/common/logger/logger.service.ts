import { Injectable } from '@nestjs/common';

export interface LogMetadata {
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggerService {
  private readonly serviceName = 'danta-api';

  private format(level: string, message: string, context: string, metadata?: LogMetadata): string {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      context: context ?? 'Application',
    };
    if (metadata && Object.keys(metadata).length > 0) {
      Object.assign(entry, metadata);
    }
    return JSON.stringify(entry);
  }

  log(message: string, context: string, metadata?: LogMetadata) {
    console.log(this.format('log', message, context, metadata));
  }

  error(message: string, context: string, metadata?: LogMetadata) {
    console.error(this.format('error', message, context, metadata));
  }

  warn(message: string, context: string, metadata?: LogMetadata) {
    console.warn(this.format('warn', message, context, metadata));
  }

  info(message: string, context: string, metadata?: LogMetadata) {
    console.info(this.format('info', message, context, metadata));
  }

  debug(message: string, context: string, metadata?: LogMetadata) {
    console.debug(this.format('debug', message, context, metadata));
  }
}
