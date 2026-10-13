import { CanDeactivateFn } from '@angular/router';
export interface PendingReview {
  hasUnsavedChanges(): boolean;
}
export const pendingReviewGuard: CanDeactivateFn<PendingReview> = (component) =>
  !component.hasUnsavedChanges() || globalThis.confirm('Discard unsaved review changes?');
