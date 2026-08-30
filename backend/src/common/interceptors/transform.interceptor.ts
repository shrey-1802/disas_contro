import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || (request as any).id;

    return next.handle().pipe(
      map((resData) => {
        // If data already has paginated structure with meta
        if (resData && typeof resData === 'object' && 'data' in resData && 'meta' in resData && 'success' in resData) {
          return resData;
        }

        if (resData && typeof resData === 'object' && 'data' in resData && 'meta' in resData) {
          return {
            success: true,
            data: resData.data,
            meta: {
              timestamp: new Date().toISOString(),
              requestId,
              ...resData.meta,
            },
          };
        }

        return {
          success: true,
          data: resData !== undefined ? resData : null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}
