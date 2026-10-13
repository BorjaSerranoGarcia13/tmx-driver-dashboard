import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../core/models/tmx.models';
import { ReviewWorkItem } from '../../core/models/review-work.models';
import { ReportExportService } from '../../core/export/report-export.service';
import { ErrorPanelComponent } from '../../shared/ui/error-panel.component';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { NotificationService } from '../../shared/ui/notification.service';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
import { DriverFacade } from '../drivers/store/driver.facade';
import { ReviewWorkFacade } from '../workspace/store/review-work.facade';

type ReviewFilter = 'all' | 'benefit' | 'risk';

interface ReviewItem {
  readonly driver: Driver;
  readonly type: Exclude<ReviewFilter, 'all'>;
  readonly label: string;
  readonly detail: string;
}

@Component({
  selector: 'app-review-queue',
  imports: [DatePipe, RouterLink, ErrorPanelComponent, LoadingBlockComponent, StatusPillComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Fleet operations</span>
        <h1>Review queue</h1>
        <p>Prioritise benefit decisions and high-risk profiles that need attention.</p>
      </div>
      <div class="page-actions">
        <button
          class="button button--primary"
          type="button"
          [disabled]="filteredItems().length === 0"
          (click)="exportQueue()"
        >
          <span aria-hidden="true">↓</span> Export queue
        </button>
      </div>
    </section>

    @if (facade.loading()) {
      <app-loading-block [height]="112" />
      <app-loading-block [height]="420" />
    } @else {
      @if (facade.error(); as error) {
        @if (facade.allDrivers().length > 0) {
          <app-error-panel [error]="error" [compact]="true" (retry)="refresh()" />
        } @else {
          <app-error-panel [error]="error" (retry)="refresh()" />
        }
      }

      @if (facade.allDrivers().length > 0) {
        <section class="queue-filter-bar" aria-label="Review queue filters">
          <label class="field field--search"
            ><span>Search</span
            ><input
              type="search"
              [value]="query()"
              (input)="setQuery($event)"
              placeholder="Name, ID or region"
          /></label>
          <label class="field"
            ><span>Review type</span
            ><select [value]="reviewFilter()" (change)="setReviewFilter($event)">
              <option value="all">All reviews</option>
              <option value="benefit">Benefit decisions</option>
              <option value="risk">High-risk profiles</option>
            </select></label
          >
          <label class="field"
            ><span>Fleet</span
            ><select [value]="fleetFilter()" (change)="setFleet($event)">
              <option value="all">All fleets</option>
              @for (fleet of fleetOptions(); track fleet) {
                <option [value]="fleet">{{ fleet }}</option>
              }
            </select></label
          >
          <div class="queue-filter-bar__meta">
            <strong>{{ filteredItems().length }}</strong
            ><span>open reviews</span>
          </div>
        </section>

        <section class="queue-summary" aria-label="Review queue summary">
          <article>
            <span>Open reviews</span><strong>{{ filteredItems().length }}</strong>
            <small>Current filtered view</small>
          </article>
          <article>
            <span>Benefit decisions</span><strong>{{ summary().benefit }}</strong>
            <small>Pending eligibility</small>
          </article>
          <article>
            <span>Risk profiles</span><strong>{{ summary().risk }}</strong>
            <small>High-risk drivers</small>
          </article>
          <article>
            <span>Highest score in queue</span><strong>{{ summary().highestScore }}</strong>
          </article>
        </section>

        @if (filteredItems().length === 0) {
          <section class="empty-panel">
            <span class="empty-panel__icon">✓</span>
            <h2>No reviews match these filters</h2>
            <p>Try a different fleet, review type or search term.</p>
            <button class="button button--primary" type="button" (click)="clearFilters()">
              Clear filters
            </button>
          </section>
        } @else {
          <section class="queue-table-panel">
            <div class="queue-table-panel__header">
              <div>
                <span class="eyebrow">Action list</span>
                <h2>Drivers requiring attention</h2>
              </div>
              <a class="text-link" routerLink="/fleet">Back to fleet overview →</a>
            </div>
            <div class="table-wrap">
              <table>
                <caption class="sr-only">
                  Drivers in the review queue
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Driver</th>
                    <th scope="col">Review</th>
                    <th scope="col">Risk</th>
                    <th scope="col">Score</th>
                    <th scope="col">Updated</th>
                    <th scope="col"><span class="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of filteredItems(); track item.driver.id) {
                    <tr>
                      <td>
                        <a class="driver-cell" [routerLink]="['/drivers', item.driver.id]">
                          <span class="avatar">{{ initials(item.driver.displayName) }}</span>
                          <span>
                            <strong>{{ item.driver.displayName }}</strong>
                            <small>{{ item.driver.id }} · {{ item.driver.region }}</small>
                          </span>
                        </a>
                      </td>
                      <td>
                        <strong class="review-type">{{ item.label }}</strong>
                        <small class="review-detail">{{ item.detail }}</small>
                      </td>
                      <td>
                        <app-status-pill
                          [value]="item.driver.riskLevel"
                          [label]="item.driver.riskLevel + ' risk'"
                        />
                      </td>
                      <td>
                        <strong class="score-value">{{ item.driver.score }}</strong
                        ><span class="score-max">/100</span>
                      </td>
                      <td>{{ item.driver.lastUpdated | date: 'dd MMM yyyy' }}</td>
                      <td>
                        <div class="review-actions">
                          <a class="row-link" [routerLink]="['/drivers', item.driver.id]"
                            >Review →</a
                          >
                          @if (isSaved(item.driver.id)) {
                            <span class="saved-label">Saved</span>
                          } @else {
                            <button
                              class="button button--inline"
                              type="button"
                              (click)="saveForLater(item.driver)"
                            >
                              Save
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    }
  `,
  styleUrls: [
    '../../shared/styles/data-table.shared.css',
    '../../shared/styles/driver-identity.shared.css',
    '../../shared/styles/filter-field.shared.css',
    '../../shared/styles/table-metadata.shared.css',
    '../../shared/styles/empty-state.shared.css',
    './review-queue.component.css',
  ],
})
export class ReviewQueueComponent implements OnInit {
  readonly facade = inject(DriverFacade);
  readonly exporter = inject(ReportExportService);
  readonly notifications = inject(NotificationService);
  readonly work = inject(ReviewWorkFacade);
  readonly query = signal('');
  readonly reviewFilter = signal<ReviewFilter>('all');
  readonly fleetFilter = signal('all');

  readonly fleetOptions = computed(() =>
    [...new Set(this.facade.allDrivers().map((driver) => driver.fleetBenchmark.fleetName))].sort(),
  );
  readonly reviewItems = computed((): readonly ReviewItem[] =>
    this.facade.allDrivers().flatMap((driver) => {
      const items: ReviewItem[] = [];
      if (driver.benefitDecision?.status === 'pending') {
        items.push({
          driver,
          type: 'benefit',
          label: 'Benefit decision',
          detail: 'Eligibility is pending review',
        });
      }
      if (driver.riskLevel === 'high') {
        items.push({
          driver,
          type: 'risk',
          label: 'Risk profile',
          detail: 'High-risk behaviour signals',
        });
      }
      return items;
    }),
  );
  readonly filteredItems = computed(() => {
    const query = this.query().trim().toLowerCase();
    const type = this.reviewFilter();
    const fleet = this.fleetFilter();

    return this.reviewItems().filter((item) => {
      const matchesQuery =
        !query ||
        item.driver.displayName.toLowerCase().includes(query) ||
        item.driver.id.toLowerCase().includes(query) ||
        item.driver.region.toLowerCase().includes(query);
      const matchesType = type === 'all' || item.type === type;
      const matchesFleet = fleet === 'all' || item.driver.fleetBenchmark.fleetName === fleet;
      return matchesQuery && matchesType && matchesFleet;
    });
  });
  readonly summary = computed(() => {
    const items = this.filteredItems();
    return {
      benefit: items.filter((item) => item.type === 'benefit').length,
      risk: items.filter((item) => item.type === 'risk').length,
      highestScore: items.length ? Math.max(...items.map((item) => item.driver.score)) : 0,
    };
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.facade.refreshDrivers();
  }

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setReviewFilter(event: Event): void {
    this.reviewFilter.set((event.target as HTMLSelectElement).value as ReviewFilter);
  }

  setFleet(event: Event): void {
    this.fleetFilter.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.query.set('');
    this.reviewFilter.set('all');
    this.fleetFilter.set('all');
  }

  exportQueue(): void {
    const drivers = [
      ...new Map(this.filteredItems().map((item) => [item.driver.id, item.driver])).values(),
    ];
    this.exporter.downloadDriversCsv(drivers, 'tmx-review-queue.csv');
    this.notifications.show({
      tone: 'success',
      title: 'Review queue exported',
      detail: `${drivers.length} driver records are ready as a CSV file.`,
    });
  }

  isSaved(driverId: string): boolean {
    return this.work.items().some((item) => item.driverId === driverId);
  }

  saveForLater(driver: Driver): void {
    const existing = this.work.items().find((item) => item.driverId === driver.id);
    const now = new Date().toISOString();
    const item: ReviewWorkItem = {
      driverId: driver.id,
      status: existing?.status ?? 'saved',
      note: existing?.note ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.work.upsert(item);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
