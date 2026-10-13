import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('maps a not-found response to user-facing copy', () => {
    const result = toApiError(new HttpErrorResponse({ status: 404 }));

    expect(result).toEqual({
      status: 404,
      title: 'Driver not found',
      detail: 'The requested driver is not available in the current driver data.',
      retryable: false,
    });
  });

  it('marks server errors as retryable', () => {
    const result = toApiError(new HttpErrorResponse({ status: 500 }));

    expect(result.status).toBe(500);
    expect(result.retryable).toBe(true);
  });

  it('distinguishes authentication from authorization failures', () => {
    const unauthenticated = toApiError(new HttpErrorResponse({ status: 401 }));
    const forbidden = toApiError(new HttpErrorResponse({ status: 403 }));

    expect(unauthenticated.title).toBe('Sign-in required');
    expect(forbidden.title).toBe('Access denied');
  });

  it('falls back safely for unknown failures', () => {
    const result = toApiError(new Error('network failure'));

    expect(result.status).toBe(0);
    expect(result.title).toBe('Something went wrong');
    expect(result.retryable).toBe(true);
  });
});
