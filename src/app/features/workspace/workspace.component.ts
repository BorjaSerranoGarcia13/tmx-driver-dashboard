import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../core/models/tmx.models';
import {
  REVIEW_WORK_STATUS_LABELS,
  REVIEW_WORK_STATUSES,
  ReviewWorkItem,
  ReviewWorkStatus,
} from '../../core/models/review-work.models';
import { ErrorPanelComponent } from '../../shared/ui/error-panel.component';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
import { DriverFacade } from '../drivers/store/driver.facade';
import { ReviewWorkFacade } from './store/review-work.facade';

type WorkStatusFilter = 'all' | ReviewWorkStatus;

interface WorkRow {
  readonly item: ReviewWorkItem;
  readonly driver: Driver | null;
}

@Component({
  selector: 'app-workspace',
  imports: [DatePipe, RouterLink, ErrorPanelComponent, LoadingBlockComponent, StatusPillComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Personal workspace</span>
        <h1>My work</h1>
        <p>Manage your driver reviews, track follow-ups and pick up where you left off.</p>
      </div>
      <button
        class="button button--ghost"
        type="button"
        [disabled]="work.items().length === 0"
        (click)="clearWorkspace()"
      >
        Clear workspace
      </button>
    </section>

    @if (work.error(); as error) {
      <section class="workspace-notice" role="alert">
        <p>{{ error }}</p>
        <button class="button button--ghost" type="button" (click)="work.hydrate()">
          Try again
        </button>
      </section>
    }
    @if (drivers.loading()) {
      <app-loading-block [height]="112" />
      <app-loading-block [height]="380" />
    } @else {
      @if (drivers.error(); as error) {
        @if (drivers.allDrivers().length > 0) {
          <app-error-panel [error]="error" [compact]="true" (retry)="refresh()" />
        } @else {
          <app-error-panel [error]="error" (retry)="refresh()" />
        }
      }

      <section class="workspace-summary" aria-label="My work summary">
        <article>
          <span>Saved reviews</span><strong>{{ work.items().length }}</strong>
        </article>
        <article>
          <span>In review</span><strong>{{ countByStatus('in-progress') }}</strong>
        </article>
        <article>
          <span>Follow-up</span><strong>{{ countByStatus('follow-up') }}</strong>
        </article>
        <article>
          <span>Done</span><strong>{{ countByStatus('done') }}</strong>
        </article>
      </section>

      @if (work.items().length > 0) {
        <section class="workspace-filter-bar" aria-label="My work filters">
          <label class="field field--search"
            ><span>Search</span
            ><input
              type="search"
              [value]="query()"
              (input)="setQuery($event)"
              placeholder="Name, ID or region"
          /></label>
          <label class="field"
            ><span>Status</span
            ><select [value]="statusFilter()" (change)="setStatusFilter($event)">
              <option value="all">All statuses</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ statusLabel(status) }}</option>
              }
            </select></label
          >
          <div class="workspace-filter-bar__meta">
            <strong>{{ filteredRows().length }}</strong
            ><span>visible reviews</span>
          </div>
        </section>

        @if (filteredRows().length === 0) {
          <section class="empty-panel">
            <span class="empty-panel__icon">⌕</span>
            <h2>No saved reviews match these filters</h2>
            <p>Try another search or reset the status filter.</p>
            <button class="button button--primary" type="button" (click)="clearFilters()">
              Clear filters
            </button>
          </section>
        } @else {
          <section class="workspace-table-panel">
            <div class="workspace-table-panel__header">
              <div>
                <h2>Saved review work</h2>
              </div>
              <a class="text-link" routerLink="/reviews">Open review queue →</a>
            </div>
            <div class="table-wrap">
              <table>
                <caption class="sr-only">
                  Saved driver reviews
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Driver</th>
                    <th scope="col">Status</th>
                    <th scope="col">Note</th>
                    <th scope="col">Last updated</th>
                    <th scope="col"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of filteredRows(); track row.item.driverId) {
                    <tr>
                      <td>
                        @if (row.driver; as driver) {
                          <a class="driver-cell" [routerLink]="['/drivers', driver.id]">
                            <span class="avatar">{{ initials(driver.displayName) }}</span>
                            <span>
                              <strong>{{ driver.displayName }}</strong>
                              <small>{{ driver.id }} · {{ driver.region }}</small>
                            </span>
                          </a>
                        } @else {
                          <span class="driver-cell driver-cell--missing">
                            <span class="avatar">?</span>
                            <span>
                              <strong>Driver unavailable</strong>
                              <small>{{ row.item.driverId }}</small>
                            </span>
                          </span>
                        }
                      </td>
                      <td>
                        <app-status-pill
                          [value]="row.item.status"
                          [label]="statusLabel(row.item.status)"
                        />
                      </td>
                      <td>
                        <span class="workspace-note">{{ row.item.note || 'No note added' }}</span>
                      </td>
                      <td>{{ row.item.updatedAt | date: 'dd MMM yyyy, HH:mm' }}</td>
                      <td>
                        <div class="workspace-row-actions">
                          @if (row.driver; as driver) {
                            <a class="row-link" [routerLink]="['/drivers', driver.id]">Open →</a>
                          }
                          <button
                            class="icon-button"
                            type="button"
                            [attr.aria-label]="
                              'Remove ' + (row.driver?.displayName ?? row.item.driverId)
                            "
                            (click)="remove(row.item)"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      } @else {
        <section class="empty-panel workspace-empty-panel">
          <span class="empty-panel__icon">+</span>
          <h2>Your review workspace is empty</h2>
          <p>Save a driver from the review queue or Driver 360 to continue later.</p>
          <a class="button button--primary" routerLink="/reviews">Open review queue</a>
        </section>
      }
    }
  `,
  styleUrls: [
    '../../shared/styles/data-table.shared.css',
    '../../shared/styles/driver-identity.shared.css',
    '../../shared/styles/filter-field.shared.css',
    './workspace.component.css',
  ],
})
export class WorkspaceComponent implements OnInit {
  readonly work = inject(ReviewWorkFacade);
  readonly drivers = inject(DriverFacade);
  readonly query = signal('');
  readonly statusFilter = signal<WorkStatusFilter>('all');
  readonly statuses = REVIEW_WORK_STATUSES;

  readonly rows = computed((): readonly WorkRow[] =>
    this.work
      .items()
      .slice()
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
      .map((item) => ({
        item,
        driver: this.drivers.allDrivers().find((driver) => driver.id === item.driverId) ?? null,
      })),
  );

  readonly filteredRows = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.rows().filter((row) => {
      const driver = row.driver;
      const matchesQuery =
        !query ||
        row.item.driverId.toLowerCase().includes(query) ||
        row.item.note.toLowerCase().includes(query) ||
        driver?.displayName.toLowerCase().includes(query) ||
        driver?.region.toLowerCase().includes(query);
      return matchesQuery && (status === 'all' || row.item.status === status);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.drivers.refreshDrivers();
  }

  countByStatus(status: ReviewWorkStatus): number {
    return this.work.items().filter((item) => item.status === status).length;
  }

  statusLabel(status: ReviewWorkStatus): string {
    return REVIEW_WORK_STATUS_LABELS[status];
  }

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as WorkStatusFilter);
  }

  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
  }

  remove(item: ReviewWorkItem): void {
    this.work.remove(item.driverId);
  }

  clearWorkspace(): void {
    this.work.clear();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
