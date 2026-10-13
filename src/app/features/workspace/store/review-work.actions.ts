import { createAction, props } from '@ngrx/store';
import { ReviewWorkItem } from '../../../core/models/review-work.models';

export const hydrate = createAction('[Review work] Hydrate');
export const hydrateSuccess = createAction(
  '[Review work] Hydrate success',
  props<{ items: readonly ReviewWorkItem[] }>(),
);
export const upsertItem = createAction(
  '[Review work] Upsert item',
  props<{ item: ReviewWorkItem }>(),
);
export const removeItem = createAction('[Review work] Remove item', props<{ driverId: string }>());
export const clearItems = createAction('[Review work] Clear items');
export const persistSuccess = createAction(
  '[Review work] Persist success',
  props<{ items: readonly ReviewWorkItem[]; operation: 'save' | 'remove' | 'clear' }>(),
);
export const storageFailure = createAction(
  '[Review work] Storage failure',
  props<{ error: string }>(),
);
