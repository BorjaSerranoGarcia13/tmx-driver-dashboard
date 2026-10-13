import { ReviewWorkStorageService } from './review-work-storage.service';

const STORAGE_KEY = 'tmx-driver-insights.review-work.v1';

const item = {
  driverId: 'tmx-001',
  status: 'follow-up' as const,
  note: 'Check the latest trend.',
  createdAt: '2026-10-12T09:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z',
};

describe('ReviewWorkStorageService', () => {
  let storage: ReviewWorkStorageService;

  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    storage = new ReviewWorkStorageService();
  });

  it('persists and replaces work for the same driver', () => {
    storage.upsert(item);
    storage.upsert({ ...item, status: 'done', note: 'Completed.' });

    expect(storage.read()).toEqual({
      ok: true,
      value: [{ ...item, status: 'done', note: 'Completed.' }],
    });
  });

  it('removes one driver without touching other saved work', () => {
    storage.upsert(item);
    storage.upsert({ ...item, driverId: 'tmx-002' });

    storage.remove(item.driverId);

    expect(storage.read()).toEqual({ ok: true, value: [{ ...item, driverId: 'tmx-002' }] });
  });

  it('ignores malformed or unsupported stored records', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ driverId: 'tmx-003', status: 'unknown' }, { nope: true }]),
    );

    expect(storage.read()).toEqual({ ok: true, value: [] });
  });
  it('reports blocked writes without changing existing data', () => {
    storage.upsert(item);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(storage.upsert({ ...item, note: 'new' }).ok).toBe(false);
    expect(storage.read()).toEqual({ ok: true, value: [item] });
  });
  it('reports read and delete failures instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(storage.read().ok).toBe(false);
    expect(storage.remove(item.driverId).ok).toBe(false);
    expect(storage.clear().ok).toBe(false);
  });
  it('preserves corrupt JSON rather than overwriting it', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    expect(storage.upsert(item).ok).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken');
  });
  it('rejects oversized notes and invalid dates', () => {
    expect(storage.upsert({ ...item, note: 'x'.repeat(501) }).ok).toBe(false);
    expect(storage.upsert({ ...item, updatedAt: 'not a date' }).ok).toBe(false);
  });
});
