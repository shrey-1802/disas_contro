import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || (request as any).id || 'req-' + Date.now();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal error occurred.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || message;
        errorCode = resObj.error || resObj.code || this.getErrorCodeFromStatus(status);
        if (Array.isArray(resObj.message)) {
          details = resObj.message;
          message = resObj.message.join('; ');
        }
      }
    } else if ((exception as any)?.code) {
      // Prisma or DB error handling without leaking internals
      const dbCode = (exception as any).code;
      if (dbCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = 'A resource with this identifier already exists.';
      } else if (dbCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'RESOURCE_NOT_FOUND';
        message = 'The requested resource was not found.';
      } else {
        this.logger.error(`Database error [${dbCode}]: ${(exception as Error).message}`, (exception as Error).stack);
        message = 'Database operation failed.';
      }
    } else {
      this.logger.error(`Unhandled error: ${(exception as Error)?.message || exception}`, (exception as Error)?.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        statusCode: status,
        requestId,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'INVALID_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
