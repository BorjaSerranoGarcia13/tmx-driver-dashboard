import { Injectable } from '@angular/core';
import {
  REVIEW_WORK_NOTE_MAX_LENGTH,
  REVIEW_WORK_STATUSES,
  ReviewWorkItem,
} from '../models/review-work.models';

const STORAGE_KEY = 'tmx-driver-insights.review-work.v1';
export type StorageResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

@Injectable({ providedIn: 'root' })
export class ReviewWorkStorageService {
  read(): StorageResult<readonly ReviewWorkItem[]> {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return this.unavailable();
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { ok: true, value: [] };
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return this.unavailable();
      return { ok: true, value: parsed.filter(isReviewWorkItem) };
    } catch {
      return this.unavailable();
    }
  }

  upsert(item: ReviewWorkItem): StorageResult<readonly ReviewWorkItem[]> {
    if (!isReviewWorkItem(item))
      return { ok: false, error: 'Review data is invalid. Check the status and note length.' };
    const result = this.read();
    return result.ok
      ? this.write([
          ...result.value.filter((existing) => existing.driverId !== item.driverId),
          item,
        ])
      : result;
  }

  remove(driverId: string): StorageResult<readonly ReviewWorkItem[]> {
    const result = this.read();
    return result.ok
      ? this.write(result.value.filter((item) => item.driverId !== driverId))
      : result;
  }

  clear(): StorageResult<readonly ReviewWorkItem[]> {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return this.unavailable();
      storage.removeItem(STORAGE_KEY);
      return { ok: true, value: [] };
    } catch {
      return this.unavailable();
    }
  }

  private write(items: readonly ReviewWorkItem[]): StorageResult<readonly ReviewWorkItem[]> {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return this.unavailable();
      storage.setItem(STORAGE_KEY, JSON.stringify(items));
      return { ok: true, value: items };
    } catch {
      return {
        ok: false,
        error:
          'Changes were not saved. Browser storage may be blocked or full. Your draft is still here; free space or enable storage and try again.',
      };
    }
  }

  private unavailable(): StorageResult<never> {
    return {
      ok: false,
      error:
        'Browser storage is unavailable or saved data could not be read. Existing reviews have not been changed. Enable storage and try again.',
    };
  }
}

function isReviewWorkItem(value: unknown): value is ReviewWorkItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item['driverId'] === 'string' &&
    item['driverId'].length > 0 &&
    typeof item['note'] === 'string' &&
    item['note'].length <= REVIEW_WORK_NOTE_MAX_LENGTH &&
    typeof item['createdAt'] === 'string' &&
    Number.isFinite(Date.parse(item['createdAt'])) &&
    typeof item['updatedAt'] === 'string' &&
    Number.isFinite(Date.parse(item['updatedAt'])) &&
    typeof item['status'] === 'string' &&
    REVIEW_WORK_STATUSES.includes(item['status'] as ReviewWorkItem['status'])
  );
}
