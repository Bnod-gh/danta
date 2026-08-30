import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  410: 'Gone',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private httpStatusName(statusCode: number): string {
    return HTTP_STATUS_TEXT[statusCode] ?? HttpStatus[statusCode] ?? 'Error';
  }

  private buildErrorResponse(
    statusCode: number,
    message: string,
    request: Request,
  ): ErrorResponse {
    if (this.isProduction() && statusCode >= 500) {
      return {
        statusCode,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    return {
      statusCode,
      message,
      error: this.httpStatusName(statusCode),
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let isExpectedClientError = false;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as Record<string, unknown>;
        message =
          typeof body.message === 'string'
            ? body.message
            : typeof body.error === 'string'
              ? body.error
              : message;
      } else {
        message = exception.message;
      }

      // Business-rule responses (validation, lockout, conflicts…) are
      // expected traffic: one readable line, no stack trace noise.
      isExpectedClientError = statusCode < 500;
      if (isExpectedClientError) {
        console.warn(`[api] ${request.method} ${request.url} -> ${statusCode} | ${message}`);
      } else {
        console.error(`[api] ${request.method} ${request.url} -> ${statusCode} | ${message}`, exception);
      }
    } else if (exception instanceof Error) {
      message = this.isProduction() ? 'Internal server error' : exception.message;
      console.error('Unhandled error:', exception);
    }

    const errorResponse = this.buildErrorResponse(statusCode, message, request);

    response.status(statusCode).json(errorResponse);
  }
}
