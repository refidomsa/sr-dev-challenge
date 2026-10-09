import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';


const STATUS_BY_ERROR_CODE: Record<string, number> = {
  INVALID_CREDENTIALS: 401,
  FORBIDDEN_ACTION: 403,
  ORDER_NOT_FOUND: 404,
  DISTRIBUTOR_NOT_FOUND: 404,
  PRODUCT_NOT_FOUND: 404,
  INVALID_PAGINATION: 400,
  // The order is not in a status that allows the change
  INVALID_TRANSITION: 409,
};
const DEFAULT_BUSINESS_ERROR_STATUS = 422;

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  errors?: string[];
}


@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();

    const problem = this.toProblem(exception, request.originalUrl);

    response
      .status(problem.status)
      .contentType('application/problem+json')
      .send(JSON.stringify(problem));
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    // 1. An error of the business (domain or application)
    if (exception instanceof DomainError) {
      const status =
        STATUS_BY_ERROR_CODE[exception.code] ?? DEFAULT_BUSINESS_ERROR_STATUS;

      return {
        type: `https://refidomsa.test/problems/${exception.code.toLowerCase()}`,
        title: exception.name,
        status: status,
        detail: exception.message,
        instance: instance,
        code: exception.code,
      };
    }


    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: exception.name,
        status: status,
        detail: exception.message,
        instance: instance,
        code: 'HTTP_ERROR',
      };

      // The validation of a DTO brings one message per invalid field
      const body = exception.getResponse();
      if (typeof body === 'object' && 'message' in body) {
        const messages = body.message;
        if (Array.isArray(messages)) {
          problem.code = 'VALIDATION_ERROR';
          problem.detail = 'The request has invalid fields';
          problem.errors = messages as string[];
        }
      }

      return problem;
    }

    // 3. Anything else is a bug: log it, and do not show the details to the client
    this.logger.error(exception);
    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error happened',
      instance: instance,
      code: 'INTERNAL_ERROR',
    };
  }
}
