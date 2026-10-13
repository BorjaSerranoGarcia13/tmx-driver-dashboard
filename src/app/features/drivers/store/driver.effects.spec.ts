import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject, firstValueFrom, of, throwError } from 'rxjs';
import { ApiError, Driver } from '../../../core/models/tmx.models';
import { DriverApiService } from '../../../core/api/driver-api.service';
import { toApiError } from '../../../core/api/api-error';
import * as DriverActions from './driver.actions';
import { DriverEffects } from './driver.effects';

const driver: Driver = {
  id: 'tmx-effect-1',
  displayName: 'Effect Driver',
  region: 'Madrid',
  score: 88,
  riskLevel: 'low',
  annualDistanceKm: 10000,
  harshBrakingEvents: 1,
  speedingEvents: 0,
  trend: 'stable',
  benefits: [],
  lastUpdated: '2026-09-01T09:00:00Z',
  scoreHistory: [{ label: 'Sep', score: 88 }],
  criteria: [],
  benefitDecision: null,
  decisionHistory: [],
  fleetBenchmark: {
    fleetName: 'Test fleet',
    averageScore: 78,
    rank: 1,
    totalDrivers: 2,
  },
};

describe('DriverEffects', () => {
  let actions$: Observable<unknown>;
  let effects: DriverEffects;
  const api = {
    getDrivers: vi.fn(),
    getDriver: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DriverEffects,
        provideHttpClient(),
        provideMockActions(() => actions$),
        { provide: DriverApiService, useValue: api },
      ],
    });
    effects = TestBed.inject(DriverEffects);
    vi.clearAllMocks();
  });

  it('maps a successful list request to a success action', async () => {
    api.getDrivers.mockReturnValue(of([driver]));
    actions$ = of(DriverActions.loadDrivers());

    await expect(firstValueFrom(effects.loadDrivers$)).resolves.toEqual(
      DriverActions.loadDriversSuccess({ drivers: [driver] }),
    );
  });

  it('maps a detail request failure to a normalized error action', async () => {
    const response = { status: 404 };
    api.getDriver.mockReturnValue(throwError(() => response));
    actions$ = of(DriverActions.loadDriver({ id: 'missing' }));

    const result = await firstValueFrom(effects.loadDriver$);
    const expectedError: ApiError = toApiError(response);

    expect(result).toEqual(DriverActions.loadDriverFailure({ error: expectedError }));
  });

  it('cancels superseded requests and continues after an error', () => {
    const requests = new Subject<ReturnType<typeof DriverActions.loadDriver>>();
    const stale = new Subject<Driver>();
    const current = new Subject<Driver>();
    actions$ = requests;
    api.getDriver
      .mockReturnValueOnce(stale)
      .mockReturnValueOnce(current)
      .mockReturnValueOnce(of(driver));
    const outcomes: unknown[] = [];
    const subscription = effects.loadDriver$.subscribe((action) => outcomes.push(action));
    requests.next(DriverActions.loadDriver({ id: 'old' }));
    requests.next(DriverActions.loadDriver({ id: 'new' }));
    stale.next(driver);
    expect(outcomes).toEqual([]);
    current.error({ status: 500 });
    requests.next(DriverActions.loadDriver({ id: 'retry' }));
    expect(outcomes).toHaveLength(2);
    expect(outcomes[1]).toEqual(DriverActions.loadDriverSuccess({ driver }));
    subscription.unsubscribe();
  });
});
