import { ApiError, Driver } from '../../../core/models/tmx.models';
import * as DriverActions from './driver.actions';
import { driverReducer, initialDriverState } from './driver.reducer';
import { selectVisibleDrivers } from './driver.selectors';

const firstDriver: Driver = {
  id: 'tmx-test-1',
  displayName: 'Test Driver',
  region: 'Madrid',
  score: 84,
  riskLevel: 'low',
  annualDistanceKm: 12000,
  harshBrakingEvents: 2,
  speedingEvents: 1,
  trend: 'improving',
  benefits: [],
  lastUpdated: '2026-09-01T09:00:00Z',
  scoreHistory: [{ label: 'Sep', score: 84 }],
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

const secondDriver = { ...firstDriver, id: 'tmx-test-2', score: 52, riskLevel: 'high' as const };

describe('driverReducer', () => {
  it('sets loading while drivers are requested', () => {
    const state = driverReducer(initialDriverState, DriverActions.loadDrivers());

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores drivers after a successful request', () => {
    const state = driverReducer(
      { ...initialDriverState, loading: true },
      DriverActions.loadDriversSuccess({ drivers: [firstDriver] }),
    );

    expect(state.items).toEqual([firstDriver]);
    expect(state.loading).toBe(false);
  });

  it('stores a normalized API error after a failed request', () => {
    const error: ApiError = {
      status: 500,
      title: 'The service is unavailable',
      detail: 'Try again.',
      retryable: true,
    };
    const state = driverReducer(
      { ...initialDriverState, loading: true },
      DriverActions.loadDriversFailure({ error }),
    );

    expect(state.loading).toBe(false);
    expect(state.error).toEqual(error);
  });

  it('keeps query and risk filter in store state', () => {
    const filtered = driverReducer(
      initialDriverState,
      DriverActions.setRiskFilter({ riskFilter: 'high' }),
    );
    const visibleDrivers = selectVisibleDrivers({
      drivers: {
        ...filtered,
        items: [firstDriver, secondDriver],
        query: 'test',
      },
    });

    expect(filtered.riskFilter).toBe('high');
    expect(visibleDrivers).toEqual([secondDriver]);
  });
  it('preserves memoized visible rows for unrelated detail state changes', () => {
    const state = { ...initialDriverState, items: [firstDriver, secondDriver] };
    const rows = selectVisibleDrivers({ drivers: state });
    expect(selectVisibleDrivers({ drivers: { ...state, detailLoading: true } })).toBe(rows);
  });
});
