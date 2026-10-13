import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'error' | 'warning' | 'info' | 'success';

export interface NotificationToast {
  readonly id: number;
  readonly tone: NotificationTone;
  readonly title: string;
  readonly detail: string;
  readonly actionLabel?: string;
  readonly action?: () => void;
}

export type NotificationInput = Omit<NotificationToast, 'id'> & {
  readonly durationMs?: number;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly state = signal<readonly NotificationToast[]>([]);
  readonly notifications = this.state.asReadonly();

  show(input: NotificationInput): void {
    const { durationMs = 8000, ...toast } = input;
    const id = ++this.nextId;
    this.state.update((items) => [...items, { ...toast, id }]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  dismiss(id: number): void {
    this.state.update((items) => items.filter((item) => item.id !== id));
  }
}
