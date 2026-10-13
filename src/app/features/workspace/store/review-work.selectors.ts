import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReviewWorkState } from './review-work.reducer';

export const selectReviewWorkState = createFeatureSelector<ReviewWorkState>('reviewWork');
export const selectReviewWorkItems = createSelector(selectReviewWorkState, (state) => state.items);
export const selectReviewWorkSaving = createSelector(
  selectReviewWorkState,
  (state) => state.saving,
);
export const selectReviewWorkError = createSelector(selectReviewWorkState, (state) => state.error);
export const selectReviewWorkHydrated = createSelector(
  selectReviewWorkState,
  (state) => state.hydrated,
);
