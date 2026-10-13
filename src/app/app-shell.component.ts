import { Component, effect, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiError } from './core/models/tmx.models';
import { DriverFacade } from './features/drivers/store/driver.facade';
import { ApiScenarioControlComponent } from './shared/ui/api-scenario-control.component';
import { ErrorDialogComponent } from './shared/ui/error-dialog.component';
import { ErrorDialogService } from './shared/ui/error-dialog.service';
import { NotificationService } from './shared/ui/notification.service';
import { ToastCenterComponent } from './shared/ui/toast-center.component';
import { ReviewWorkFacade } from './features/workspace/store/review-work.facade';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ApiScenarioControlComponent,
    ErrorDialogComponent,
    ToastCenterComponent,
  ],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard" aria-label="TMX Driver Insights home">
          <span class="brand__mark">T</span>
          <span><strong>TMX</strong><small>Driver Insights</small></span>
        </a>
        <div class="sidebar__section">
          <span class="eyebrow">Workspace</span>
          <nav aria-label="Primary navigation">
            <a
              routerLink="/dashboard"
              routerLinkActive="nav-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
            >
              <span aria-hidden="true">◈</span> Overview
            </a>
            <a routerLink="/drivers" routerLinkActive="nav-link--active" class="nav-link">
              <span aria-hidden="true">◎</span> Drivers
            </a>
            <a routerLink="/fleet" routerLinkActive="nav-link--active" class="nav-link">
              <span aria-hidden="true">▥</span> Fleet
            </a>
            <a routerLink="/reviews" routerLinkActive="nav-link--active" class="nav-link">
              <span aria-hidden="true">✓</span> Reviews
            </a>
            <a routerLink="/my-work" routerLinkActive="nav-link--active" class="nav-link">
              <span aria-hidden="true">▣</span> My work
              @if (workspace.items().length > 0) {
                <span class="nav-link__badge">{{ workspace.items().length }}</span>
              }
            </a>
          </nav>
        </div>
        <div class="sidebar__footer">
          <span class="status-dot"></span>
          <span><strong>Operations workspace</strong><small>Driver insights</small></span>
        </div>
      </aside>

      <div class="app-shell__body">
        <header class="topbar">
          <div>
            <span class="eyebrow">Motor telematics workspace</span>
          </div>
          <app-api-scenario-control />
        </header>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-center />
    <app-error-dialog />
  `,
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent implements OnInit {
  private readonly facade = inject(DriverFacade);
  private readonly notifications = inject(NotificationService);
  private readonly errorDialog = inject(ErrorDialogService);
  readonly workspace = inject(ReviewWorkFacade);
  private lastListErrorKey = '';

  private readonly listErrorEffect = effect(() => {
    const error = this.facade.error();
    const hasExistingData = this.facade.summary().totalDrivers > 0;

    if (!error) {
      this.lastListErrorKey = '';
      return;
    }

    const key = `${error.status}:${error.title}`;
    if (key === this.lastListErrorKey) return;

    this.lastListErrorKey = key;
    if (hasExistingData) {
      this.showApiNotification(error, () => this.facade.refreshDrivers());
    } else {
      this.showErrorDialog(error, () => this.facade.refreshDrivers());
    }
  });

  ngOnInit(): void {
    this.workspace.hydrate();
  }

  private showApiNotification(error: ApiError, retry?: () => void): void {
    this.notifications.show({
      tone: error.status >= 500 || error.status === 0 ? 'error' : 'warning',
      title: error.status >= 500 || error.status === 0 ? 'Unable to refresh data' : error.title,
      detail: 'Showing the last successful version of the driver data.',
      actionLabel: retry && error.retryable ? 'Try again' : undefined,
      action: retry && error.retryable ? retry : undefined,
      durationMs: retry && error.retryable ? 0 : 8000,
    });
  }

  private showErrorDialog(error: ApiError, retry?: () => void): void {
    this.errorDialog.show({
      error,
      retry: error.retryable ? retry : undefined,
    });
  }
}
