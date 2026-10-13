export type ReviewWorkStatus = 'saved' | 'in-progress' | 'follow-up' | 'done';

export interface ReviewWorkItem {
  readonly driverId: string;
  readonly status: ReviewWorkStatus;
  readonly note: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const REVIEW_WORK_STATUS_LABELS: Readonly<Record<ReviewWorkStatus, string>> = {
  saved: 'Saved',
  'in-progress': 'In review',
  'follow-up': 'Follow-up',
  done: 'Done',
};

export const REVIEW_WORK_STATUSES: readonly ReviewWorkStatus[] = [
  'saved',
  'in-progress',
  'follow-up',
  'done',
];

export const REVIEW_WORK_NOTE_MAX_LENGTH = 500;
