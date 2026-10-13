import { ReviewWorkItem } from '../../../core/models/review-work.models';
import * as ReviewWorkActions from './review-work.actions';
import { initialReviewWorkState, reviewWorkReducer } from './review-work.reducer';

const firstItem: ReviewWorkItem = {
  driverId: 'tmx-001',
  status: 'saved',
  note: '',
  createdAt: '2026-10-12T09:00:00.000Z',
  updatedAt: '2026-10-12T09:00:00.000Z',
};

describe('reviewWorkReducer', () => {
  it('hydrates saved work and marks the state as ready', () => {
    const state = reviewWorkReducer(
      initialReviewWorkState,
      ReviewWorkActions.hydrateSuccess({ items: [firstItem] }),
    );

    expect(state.items).toEqual([firstItem]);
    expect(state.hydrated).toBe(true);
  });

  it('updates an existing driver instead of creating a duplicate', () => {
    const state = reviewWorkReducer(
      { ...initialReviewWorkState, items: [firstItem] },
      ReviewWorkActions.persistSuccess({
        items: [{ ...firstItem, status: 'in-progress' }],
        operation: 'save',
      }),
    );

    expect(state.items).toHaveLength(1);
    expect(state.items[0].status).toBe('in-progress');
  });

  it('removes and clears review work', () => {
    const withItems = { ...initialReviewWorkState, items: [firstItem] };
    const removed = reviewWorkReducer(
      withItems,
      ReviewWorkActions.persistSuccess({ items: [], operation: 'remove' }),
    );

    expect(removed.items).toEqual([]);
    expect(
      reviewWorkReducer(
        withItems,
        ReviewWorkActions.persistSuccess({ items: [], operation: 'clear' }),
      ).items,
    ).toEqual([]);
  });
  it('does not commit pending or failed operations', () => {
    const existing = { ...initialReviewWorkState, items: [firstItem] };
    for (const action of [
      ReviewWorkActions.upsertItem({ item: { ...firstItem, note: 'new' } }),
      ReviewWorkActions.removeItem({ driverId: firstItem.driverId }),
      ReviewWorkActions.clearItems(),
    ]) {
      const pending = reviewWorkReducer(existing, action);
      expect(pending.items).toBe(existing.items);
      expect(pending.saving).toBe(true);
      const failed = reviewWorkReducer(
        pending,
        ReviewWorkActions.storageFailure({ error: 'Blocked' }),
      );
      expect(failed.items).toBe(existing.items);
      expect(failed.saving).toBe(false);
      expect(failed.error).toBe('Blocked');
    }
  });
});
