import { createReducer, on } from '@ngrx/store';
import { ApiError, Driver, DriverSort, RiskFilter } from '../../../core/models/tmx.models';
import * as DriverActions from './driver.actions';

export interface DriverState {
  readonly items: readonly Driver[];
  readonly selected: Driver | null;
  readonly loading: boolean;
  readonly detailLoading: boolean;
  readonly error: ApiError | null;
  readonly detailError: ApiError | null;
  readonly query: string;
  readonly fleetFilter: string;
  readonly riskFilter: RiskFilter;
  readonly sort: DriverSort;
}

export const initialDriverState: DriverState = {
  items: [],
  selected: null,
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  query: '',
  fleetFilter: 'all',
  riskFilter: 'all',
  sort: 'score-desc',
};

export const driverReducer = createReducer(
  initialDriverState,
  on(DriverActions.loadDrivers, (state) => ({ ...state, loading: true, error: null })),
  on(DriverActions.loadDriversSuccess, (state, { drivers }) => ({
    ...state,
    items: drivers,
    loading: false,
    error: null,
  })),
  on(DriverActions.loadDriversFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(DriverActions.loadDriver, (state) => ({
    ...state,
    selected: null,
    detailLoading: true,
    detailError: null,
  })),
  on(DriverActions.loadDriverSuccess, (state, { driver }) => ({
    ...state,
    selected: driver,
    detailLoading: false,
    detailError: null,
  })),
  on(DriverActions.loadDriverFailure, (state, { error }) => ({
    ...state,
    detailLoading: false,
    detailError: error,
  })),
  on(DriverActions.setQuery, (state, { query }) => ({ ...state, query })),
  on(DriverActions.setFleet, (state, { fleetFilter }) => ({ ...state, fleetFilter })),
  on(DriverActions.setRiskFilter, (state, { riskFilter }) => ({ ...state, riskFilter })),
  on(DriverActions.setSort, (state, { sort }) => ({ ...state, sort })),
);
