import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs';
import { ReviewWorkStorageService } from '../../../core/storage/review-work-storage.service';
import { NotificationService } from '../../../shared/ui/notification.service';
import * as Work from './review-work.actions';

@Injectable()
export class ReviewWorkEffects {
  private readonly actions$ = inject(Actions);
  private readonly storage = inject(ReviewWorkStorageService);
  private readonly notifications = inject(NotificationService);

  readonly hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Work.hydrate),
      map(() => {
        const result = this.storage.read();
        return result.ok
          ? Work.hydrateSuccess({ items: result.value })
          : Work.storageFailure({ error: result.error });
      }),
    ),
  );

  readonly persist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Work.upsertItem, Work.removeItem, Work.clearItems),
      map((action) => {
        const result =
          action.type === Work.upsertItem.type
            ? this.storage.upsert(action.item)
            : action.type === Work.removeItem.type
              ? this.storage.remove(action.driverId)
              : this.storage.clear();
        const operation =
          action.type === Work.upsertItem.type
            ? 'save'
            : action.type === Work.removeItem.type
              ? 'remove'
              : 'clear';
        return result.ok
          ? Work.persistSuccess({ items: result.value, operation })
          : Work.storageFailure({ error: result.error });
      }),
    ),
  );

  readonly feedback$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(Work.persistSuccess, Work.storageFailure),
        tap((action) => {
          if (action.type === Work.storageFailure.type) {
            this.notifications.show({
              tone: 'error',
              title: 'Unable to update My work',
              detail: action.error,
              durationMs: 0,
            });
          } else {
            const titles = {
              save: 'Review saved',
              remove: 'Review removed',
              clear: 'Workspace cleared',
            };
            const details = {
              save: 'Your review is ready to continue in My work.',
              remove: 'The review has been removed from My work.',
              clear: 'All saved reviews have been removed from My work.',
            };
            this.notifications.show({
              tone: 'success',
              title: titles[action.operation],
              detail: details[action.operation],
              durationMs: 5000,
            });
          }
        }),
      ),
    { dispatch: false },
  );
}
