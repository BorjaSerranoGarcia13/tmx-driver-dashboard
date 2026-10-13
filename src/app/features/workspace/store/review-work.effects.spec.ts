import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { of, firstValueFrom } from 'rxjs';
import { ReviewWorkStorageService } from '../../../core/storage/review-work-storage.service';
import { NotificationService } from '../../../shared/ui/notification.service';
import { ReviewWorkEffects } from './review-work.effects';
import * as Work from './review-work.actions';

describe('ReviewWorkEffects', () => {
  const item = {
    driverId: 'a',
    status: 'saved' as const,
    note: '',
    createdAt: '2026-10-12',
    updatedAt: '2026-10-12',
  };
  it.each([true, false])('emits persistence outcome (success=%s)', async (ok) => {
    TestBed.configureTestingModule({
      providers: [
        ReviewWorkEffects,
        provideMockActions(() => of(Work.upsertItem({ item }))),
        {
          provide: ReviewWorkStorageService,
          useValue: {
            upsert: () => (ok ? { ok: true, value: [item] } : { ok: false, error: 'Full' }),
          },
        },
      ],
    });
    const result = await firstValueFrom(TestBed.inject(ReviewWorkEffects).persist$);
    expect(result).toEqual(
      ok
        ? Work.persistSuccess({ items: [item], operation: 'save' })
        : Work.storageFailure({ error: 'Full' }),
    );
  });
  it('reports read failures without completing the effect with an error', async () => {
    TestBed.configureTestingModule({
      providers: [
        ReviewWorkEffects,
        provideMockActions(() => of(Work.hydrate())),
        {
          provide: ReviewWorkStorageService,
          useValue: { read: () => ({ ok: false, error: 'Blocked' }) },
        },
      ],
    });
    expect(await firstValueFrom(TestBed.inject(ReviewWorkEffects).hydrate$)).toEqual(
      Work.storageFailure({ error: 'Blocked' }),
    );
  });
  it('only shows an error notification on failed persistence', async () => {
    const show = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        ReviewWorkEffects,
        provideMockActions(() => of(Work.storageFailure({ error: 'Full' }))),
        { provide: NotificationService, useValue: { show } },
      ],
    });
    await firstValueFrom(TestBed.inject(ReviewWorkEffects).feedback$);
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error', detail: 'Full' }));
    expect(show).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['save', 'Review saved', 'Your review is ready to continue in My work.'],
    ['remove', 'Review removed', 'The review has been removed from My work.'],
    ['clear', 'Workspace cleared', 'All saved reviews have been removed from My work.'],
  ] as const)(
    'describes the confirmed %s operation without storage jargon',
    async (operation, title, detail) => {
      const show = vi.fn();
      TestBed.configureTestingModule({
        providers: [
          ReviewWorkEffects,
          provideMockActions(() => of(Work.persistSuccess({ items: [], operation }))),
          { provide: NotificationService, useValue: { show } },
        ],
      });
      await firstValueFrom(TestBed.inject(ReviewWorkEffects).feedback$);
      expect(show).toHaveBeenCalledExactlyOnceWith({
        tone: 'success',
        title,
        detail,
        durationMs: 5000,
      });
    },
  );
});
