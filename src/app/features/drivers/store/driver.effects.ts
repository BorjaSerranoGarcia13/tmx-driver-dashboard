import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { DriverApiService } from '../../../core/api/driver-api.service';
import { toApiError } from '../../../core/api/api-error';
import * as DriverActions from './driver.actions';

@Injectable()
export class DriverEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(DriverApiService);

  readonly loadDrivers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.loadDrivers),
      switchMap(() =>
        this.api.getDrivers().pipe(
          map((drivers) => DriverActions.loadDriversSuccess({ drivers })),
          catchError((error: unknown) =>
            of(DriverActions.loadDriversFailure({ error: toApiError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly loadDriver$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.loadDriver),
      switchMap(({ id }) =>
        this.api.getDriver(id).pipe(
          map((driver) => DriverActions.loadDriverSuccess({ driver })),
          catchError((error: unknown) =>
            of(DriverActions.loadDriverFailure({ error: toApiError(error) })),
          ),
        ),
      ),
    ),
  );
}
