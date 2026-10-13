import { Component, input, output } from '@angular/core';
import { ApiError } from '../../core/models/tmx.models';

@Component({
  selector: 'app-error-panel',
  template: `
    <section class="error-panel" [class.error-panel--compact]="compact()" role="alert">
      <span class="error-panel__code">{{ error()?.status || 'N/A' }}</span>
      <div class="error-panel__body">
        <h2>{{ error()?.title }}</h2>
        <p>
          {{ error()?.detail }}
          @if (compact()) {
            <span>Showing the last successful version of the data.</span>
          }
        </p>
      </div>
      <div class="error-panel__actions">
        @if (error()?.retryable) {
          <button class="button button--primary" type="button" (click)="retry.emit()">
            Try again
          </button>
        }
        @if (showBack()) {
          <button class="button button--ghost" type="button" (click)="back.emit()">
            Back to drivers
          </button>
        }
      </div>
    </section>
  `,
  styleUrl: './error-panel.component.css',
})
export class ErrorPanelComponent {
  readonly error = input.required<ApiError | null>();
  readonly showBack = input(false);
  readonly compact = input(false);
  readonly retry = output<void>();
  readonly back = output<void>();
}
