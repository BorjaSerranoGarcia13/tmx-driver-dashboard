import { createAction, props } from '@ngrx/store';
import { ApiError, Driver, DriverSort, RiskFilter } from '../../../core/models/tmx.models';

export const loadDrivers = createAction('[Drivers] Load drivers');
export const loadDriversSuccess = createAction(
  '[Drivers] Load drivers success',
  props<{ drivers: Driver[] }>(),
);
export const loadDriversFailure = createAction(
  '[Drivers] Load drivers failure',
  props<{ error: ApiError }>(),
);

export const loadDriver = createAction('[Drivers] Load driver', props<{ id: string }>());
export const loadDriverSuccess = createAction(
  '[Drivers] Load driver success',
  props<{ driver: Driver }>(),
);
export const loadDriverFailure = createAction(
  '[Drivers] Load driver failure',
  props<{ error: ApiError }>(),
);

export const setQuery = createAction('[Drivers] Set query', props<{ query: string }>());
export const setFleet = createAction('[Drivers] Set fleet', props<{ fleetFilter: string }>());
export const setRiskFilter = createAction(
  '[Drivers] Set risk filter',
  props<{ riskFilter: RiskFilter }>(),
);
export const setSort = createAction('[Drivers] Set sort', props<{ sort: DriverSort }>());
