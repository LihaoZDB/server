import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, Observable } from 'rxjs';

type ResponsePayload = {
  message?: string;
  code?: number;
  data?: unknown;
};

type ResponseBody = {
  timestamp: string;
  path: string;
  message: string;
  code: number;
  success: true;
  data: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeResponsePayload = (data: unknown): ResponsePayload => {
  if (!isRecord(data)) {
    return {};
  }

  return {
    message: typeof data.message === 'string' ? data.message : undefined,
    code: typeof data.code === 'number' ? data.code : undefined,
    data: data.data,
  };
};

// 将bigint转换为字符串，并保留日期类型不变
const transformBigInt = (obj: unknown): unknown => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(transformBigInt);
  }
  if (obj !== null && typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, transformBigInt(value)]),
    );
  }
  return obj;
};

@Injectable()
export class InterceptorInterceptor implements NestInterceptor<
  unknown,
  ResponseBody
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseBody> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    return next.handle().pipe(
      map((data) => {
        const payload = normalizeResponsePayload(data);

        return {
          timestamp: new Date().toISOString(),
          path: request.url,
          message: payload.message ?? '请求成功',
          code: payload.code ?? 200,
          success: true,
          data: transformBigInt(payload.data) ?? null,
        };
      }),
    );
  }
}
