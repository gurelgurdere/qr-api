import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { LogService } from '../log.service';
import { SKIP_LOGGING_KEY } from '../decorators/skip-logging.decorator';

interface RequestWithUser extends Request {
  user?: { userId: number };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logService: LogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Check if logging should be skipped for this handler or controller
    const skipLogging = this.reflector.getAllAndOverride<boolean>(
      SKIP_LOGGING_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipLogging) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const startTime = Date.now();

    // Collect request info
    const serviceName = `${request.method} ${request.url}`;
    const serviceData = this.sanitizeBody(request.body);
    const userId = request.user?.userId;
    const usageTime = new Date();

    return next.handle().pipe(
      tap((responseBody) => {
        // Log successful response (fire and forget)
        const duration = Date.now() - startTime;
        this.logService.log({
          serviceName,
          serviceData,
          userId,
          usageTime,
          resultMessage: `Success (${duration}ms)`,
        });
      }),
      catchError((error) => {
        // Log error response (fire and forget)
        const duration = Date.now() - startTime;
        this.logService.log({
          serviceName,
          serviceData,
          userId,
          usageTime,
          resultMessage: `Error: ${error.message} (${duration}ms)`,
        });
        throw error;
      }),
    );
  }

  private sanitizeBody(body: unknown): string | undefined {
    if (!body || Object.keys(body as object).length === 0) {
      return undefined;
    }

    try {
      // Clone body to avoid mutation
      const sanitized = { ...(body as object) };

      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          (sanitized as Record<string, unknown>)[field] = '***';
        }
      }

      return JSON.stringify(sanitized);
    } catch {
      return '[Unable to serialize body]';
    }
  }
}
