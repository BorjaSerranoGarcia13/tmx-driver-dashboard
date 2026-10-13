import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, mergeMap, of, throwError, timer } from 'rxjs';
import { DRIVER_FIXTURES } from '../data/driver-fixtures';
import { ApiScenario } from '../models/tmx.models';
import { DemoScenarioService } from './demo-scenario.service';

const FAILURE_STATUS: Readonly<Record<Exclude<ApiScenario, 'success'>, number>> = {
  'bad-request': 400,
  unauthorized: 401,
  forbidden: 403,
  'not-found': 404,
  'server-error': 500,
};

export const mockApiInterceptor: HttpInterceptorFn = (request, next: HttpHandlerFn) => {
  if (!request.url.startsWith('/api/tmx/drivers')) {
    return next(request);
  }

  const scenarioService = inject(DemoScenarioService);
  const scenario = scenarioService.scenario();
  const driverId = request.url.match(/\/api\/tmx\/drivers\/([^/?]+)/)?.[1];

  if (scenario !== 'success') {
    const status = FAILURE_STATUS[scenario];
    const error = new HttpErrorResponse({
      error: { message: `TMX demo scenario returned ${status}` },
      status,
      statusText: 'TMX demo error',
      url: request.url,
    });

    return timer(260).pipe(mergeMap(() => throwError(() => error)));
  }

  if (driverId) {
    const driver = DRIVER_FIXTURES.find((item) => item.id === driverId);

    if (!driver) {
      const error = new HttpErrorResponse({
        error: { message: 'Driver not found' },
        status: 404,
        statusText: 'Not Found',
        url: request.url,
      });

      return timer(260).pipe(mergeMap(() => throwError(() => error)));
    }

    return of(new HttpResponse({ status: 200, body: driver, url: request.url })).pipe(delay(260));
  }

  return of(new HttpResponse({ status: 200, body: DRIVER_FIXTURES, url: request.url })).pipe(
    delay(260),
  );
};
