import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';
import { NotFoundError } from '../../domain/errors/not-found.error';
import { UnauthorizedError } from '../../domain/errors/unauthorized.error';
import { ValidationError } from '../../domain/errors/validation.error';
import { ConflictError } from '../../domain/errors/conflict.error';

/**
 * Global exception filter.
 *
 * Why: the domain throws `DomainError` subtypes that know nothing about HTTP.
 * Mapping happens in one place so use cases stay framework-agnostic and adding
 * a new error type requires touching exactly one switch arm.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.normalizeHttpException(exception, status));
      return;
    }

    if (exception instanceof DomainError) {
      const status = this.mapDomainError(exception);
      response.status(status).json({
        statusCode: status,
        error: exception.name,
        message: exception.message,
      });
      return;
    }

    this.logger.error('Unhandled exception', exception as Error);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Internal server error',
    });
  }

  private mapDomainError(error: DomainError): number {
    if (error instanceof ValidationError) return HttpStatus.BAD_REQUEST;
    if (error instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
    if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (error instanceof ConflictError) return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private normalizeHttpException(
    exception: HttpException,
    status: number,
  ): Record<string, unknown> {
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return { statusCode: status, error: exception.name, message: payload };
    }
    return { statusCode: status, error: exception.name, ...(payload as object) };
  }
}
