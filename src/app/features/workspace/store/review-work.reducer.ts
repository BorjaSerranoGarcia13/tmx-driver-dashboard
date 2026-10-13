import { createReducer, on } from '@ngrx/store';
import { ReviewWorkItem } from '../../../core/models/review-work.models';
import * as ReviewWorkActions from './review-work.actions';

export interface ReviewWorkState {
  readonly items: readonly ReviewWorkItem[];
  readonly hydrated: boolean;
  readonly saving: boolean;
  readonly error: string | null;
}
export const initialReviewWorkState: ReviewWorkState = {
  items: [],
  hydrated: false,
  saving: false,
  error: null,
};
export const reviewWorkReducer = createReducer(
  initialReviewWorkState,
  on(ReviewWorkActions.hydrate, (state) => ({ ...state, error: null })),
  on(ReviewWorkActions.hydrateSuccess, (state, { items }) => ({
    ...state,
    items,
    hydrated: true,
    error: null,
  })),
  on(
    ReviewWorkActions.upsertItem,
    ReviewWorkActions.removeItem,
    ReviewWorkActions.clearItems,
    (state) => ({ ...state, saving: true, error: null }),
  ),
  on(ReviewWorkActions.persistSuccess, (state, { items }) => ({
    ...state,
    items,
    hydrated: true,
    saving: false,
    error: null,
  })),
  on(ReviewWorkActions.storageFailure, (state, { error }) => ({ ...state, saving: false, error })),
);
