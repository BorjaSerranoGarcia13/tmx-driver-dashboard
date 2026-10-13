import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/tmx.models';

const ERROR_COPY: Readonly<Record<number, Omit<ApiError, 'status'>>> = {
  400: {
    title: 'Request could not be processed',
    detail: 'The API rejected the request. Review the selected inputs and try again.',
    retryable: false,
  },
  401: {
    title: 'Sign-in required',
    detail: 'Your session is not authenticated. Sign in again before retrying.',
    retryable: false,
  },
  403: {
    title: 'Access denied',
    detail: 'Your account is authenticated but does not have permission to view this data.',
    retryable: false,
  },
  404: {
    title: 'Driver not found',
    detail: 'The requested driver is not available in the current driver data.',
    retryable: false,
  },
  500: {
    title: 'Service temporarily unavailable',
    detail: 'The service could not complete the request. Try again in a moment.',
    retryable: true,
  },
};

export function toApiError(error: unknown): ApiError {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  const copy = ERROR_COPY[status] ?? {
    title: 'Something went wrong',
    detail: 'We could not load this data. Please try again.',
    retryable: true,
  };

  return { status, ...copy };
}
