import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms [${userAgent}]`,
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const status = err.status || 500;
          this.logger.warn(
            `[${method}] ${originalUrl} ${status} - ${duration}ms - ${err.message}`,
          );
        },
      }),
    );
  }
}
