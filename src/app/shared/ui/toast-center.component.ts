import { Component, inject } from '@angular/core';
import { NotificationService, NotificationToast } from './notification.service';

@Component({
  selector: 'app-toast-center',
  template: `
    <section class="toast-center" aria-label="Notifications">
      @for (toast of notificationService.notifications(); track toast.id) {
        <article
          [class]="'toast toast--' + toast.tone"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.tone === 'error' ? 'assertive' : 'polite'"
        >
          <span class="toast__icon" aria-hidden="true">{{ iconFor(toast.tone) }}</span>
          <div class="toast__copy">
            <strong>{{ toast.title }}</strong>
            <span>{{ toast.detail }}</span>
            @if (toast.action; as action) {
              <button type="button" (click)="runAction(toast, action)">
                {{ toast.actionLabel }}
              </button>
            }
          </div>
          <button
            class="toast__dismiss"
            type="button"
            aria-label="Dismiss notification"
            (click)="notificationService.dismiss(toast.id)"
          >
            ×
          </button>
        </article>
      }
    </section>
  `,
  styleUrl: './toast-center.component.css',
})
export class ToastCenterComponent {
  readonly notificationService = inject(NotificationService);

  iconFor(tone: NotificationToast['tone']): string {
    return tone === 'error' ? '!' : tone === 'warning' ? '!' : tone === 'success' ? '✓' : 'i';
  }

  runAction(toast: NotificationToast, action: () => void): void {
    action();
    this.notificationService.dismiss(toast.id);
  }
}
