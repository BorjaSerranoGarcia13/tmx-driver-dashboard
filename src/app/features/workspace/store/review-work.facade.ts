import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReviewWorkItem } from '../../../core/models/review-work.models';
import * as ReviewWorkActions from './review-work.actions';
import {
  selectReviewWorkHydrated,
  selectReviewWorkItems,
  selectReviewWorkSaving,
  selectReviewWorkError,
} from './review-work.selectors';

@Injectable({ providedIn: 'root' })
export class ReviewWorkFacade {
  private readonly store = inject(Store);

  readonly items = this.store.selectSignal(selectReviewWorkItems);
  readonly hydrated = this.store.selectSignal(selectReviewWorkHydrated);
  readonly saving = this.store.selectSignal(selectReviewWorkSaving);
  readonly error = this.store.selectSignal(selectReviewWorkError);

  hydrate(): void {
    this.store.dispatch(ReviewWorkActions.hydrate());
  }

  upsert(item: ReviewWorkItem): void {
    this.store.dispatch(ReviewWorkActions.upsertItem({ item }));
  }

  remove(driverId: string): void {
    this.store.dispatch(ReviewWorkActions.removeItem({ driverId }));
  }

  clear(): void {
    this.store.dispatch(ReviewWorkActions.clearItems());
  }
}
