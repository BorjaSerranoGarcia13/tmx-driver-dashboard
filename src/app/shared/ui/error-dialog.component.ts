import { Component, ElementRef, afterRenderEffect, inject, viewChild } from '@angular/core';
import { ErrorDialogService } from './error-dialog.service';

@Component({
  selector: 'app-error-dialog',
  template: `
    <dialog
      #modal
      class="error-dialog"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-detail"
      (cancel)="onCancel($event)"
    >
      @if (dialogService.dialog(); as dialog) {
        <button
          class="error-dialog__close"
          type="button"
          aria-label="Close error dialog"
          (click)="dialogService.close()"
        >
          ×
        </button>
        <span class="error-dialog__code">{{ dialog.error.status || 'Network' }}</span>
        <span class="eyebrow">Request could not be completed</span>
        <h2 id="error-dialog-title">{{ dialog.error.title }}</h2>
        <p id="error-dialog-detail">{{ dialog.error.detail }}</p>
        <p class="error-dialog__guidance">{{ guidanceFor(dialog.error.status) }}</p>
        <div class="error-dialog__actions">
          @if (dialog.retry; as retry) {
            <button class="button button--primary" type="button" (click)="run(retry)">
              Try again
            </button>
          }
          @if (dialog.secondary; as secondary) {
            <button class="button button--ghost" type="button" (click)="run(secondary)">
              {{ dialog.secondaryLabel }}
            </button>
          }
          <button class="button button--ghost" type="button" (click)="dialogService.close()">
            Close
          </button>
        </div>
      }
    </dialog>
  `,
  styleUrl: './error-dialog.component.css',
  host: { '(keydown)': 'containFocus($event)' },
})
export class ErrorDialogComponent {
  readonly dialogService = inject(ErrorDialogService);

  private readonly modal = viewChild.required<ElementRef<HTMLDialogElement>>('modal');
  private readonly syncModal = afterRenderEffect(() => {
    const element = this.modal().nativeElement;
    if (this.dialogService.dialog()) {
      if (!element.open) element.showModal();
    } else if (element.open) {
      element.close();
    }
  });

  onCancel(event: Event): void {
    event.preventDefault();
    this.dialogService.close();
  }

  containFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    // This dialog contains only buttons. Explicit traversal also supports
    // Safari configurations that otherwise skip buttons in the Tab sequence.
    const element = this.modal().nativeElement;
    const buttons = Array.from(
      element.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    const active = element.ownerDocument.activeElement;
    if (!buttons.length) return;
    const index = buttons.findIndex((button) => button === active);
    const next = (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next].focus();
  }

  guidanceFor(status: number): string {
    if (status === 400) return 'Review the request details and try again.';
    if (status === 401) return 'Sign in again to continue.';
    if (status === 403) return 'This account does not have permission to view this data.';
    if (status === 404) return 'Check the identifier or return to the driver list.';
    if (status >= 500 || status === 0) return 'The service may be temporarily unavailable.';
    return 'Review the request and try again.';
  }

  run(action: () => void): void {
    this.dialogService.close();
    action();
  }
}
