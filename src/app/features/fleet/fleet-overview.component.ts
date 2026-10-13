import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver, RiskFilter } from '../../core/models/tmx.models';
import { averageDriverScore } from '../../core/models/fleet-score';
import { ReportExportService } from '../../core/export/report-export.service';
import { NotificationService } from '../../shared/ui/notification.service';
import { ErrorPanelComponent } from '../../shared/ui/error-panel.component';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { DriverFacade } from '../drivers/store/driver.facade';

interface FleetSnapshot {
  readonly name: string;
  readonly drivers: number;
  readonly averageScore: number;
  readonly highRisk: number;
  readonly eligible: number;
  readonly pending: number;
}

interface ReviewItem {
  readonly driver: Driver;
  readonly type: 'Benefit review' | 'Risk review';
  readonly reason: string;
}

@Component({
  selector: 'app-fleet-overview',
  imports: [RouterLink, ErrorPanelComponent, LoadingBlockComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Fleet operations</span>
        <h1>Fleet overview</h1>
        <p>Compare behaviour, benefits and review workload across the motor portfolio.</p>
      </div>
      <div class="page-actions">
        <button
          class="button button--primary"
          type="button"
          [disabled]="filteredDrivers().length === 0"
          (click)="exportReport()"
        >
          <span aria-hidden="true">↓</span> Export CSV
        </button>
      </div>
    </section>

    @if (facade.loading()) {
      <app-loading-block [height]="120" />
      <app-loading-block [height]="360" />
    } @else {
      @if (facade.error(); as error) {
        @if (facade.allDrivers().length > 0) {
          <app-error-panel [error]="error" [compact]="true" (retry)="refresh()" />
        } @else {
          <app-error-panel [error]="error" (retry)="refresh()" />
        }
      }

      <section class="fleet-filter-bar" aria-label="Fleet filters">
        <label class="field"
          ><span>Fleet</span
          ><select [value]="fleetFilter()" (change)="setFleet($event)">
            <option value="all">All fleets</option>
            @for (fleet of fleetOptions(); track fleet) {
              <option [value]="fleet">{{ fleet }}</option>
            }
          </select></label
        >
        <label class="field"
          ><span>Region</span
          ><select [value]="regionFilter()" (change)="setRegion($event)">
            <option value="all">All regions</option>
            @for (region of regionOptions(); track region) {
              <option [value]="region">{{ region }}</option>
            }
          </select></label
        >
        <label class="field"
          ><span>Risk</span
          ><select [value]="riskFilter()" (change)="setRisk($event)">
            <option value="all">All levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select></label
        >
        <div class="fleet-filter-bar__meta">
          <strong>{{ filteredDrivers().length }}</strong
          ><span>drivers in view</span>
        </div>
      </section>

      @if (facade.allDrivers().length > 0) {
        <section class="fleet-summary" aria-label="Fleet summary">
          <article>
            <span>Drivers in view</span><strong>{{ filteredDrivers().length }}</strong>
          </article>
          <article>
            <span>Average score</span><strong>{{ summary().averageScore }}</strong>
            <small>Drivers matching the selected filters</small>
          </article>
          <article>
            <span>High risk</span><strong>{{ summary().highRisk }}</strong>
            <small>Requires attention</small>
          </article>
          <article>
            <span>Benefit reviews</span><strong>{{ summary().pending }}</strong>
            <small>Pending decisions</small>
          </article>
        </section>

        <div class="fleet-content-grid">
          <section class="panel risk-panel">
            <div class="panel__heading">
              <div>
                <span class="eyebrow">Risk distribution</span>
                <h2>Behaviour profile</h2>
              </div>
            </div>
            <div class="risk-distribution">
              @for (item of riskDistribution(); track item.level) {
                <div class="risk-row">
                  <div class="risk-row__label">
                    <span [class]="'risk-dot risk-dot--' + item.level"></span>
                    <strong>{{ item.label }}</strong
                    ><small>{{ item.count }} drivers</small>
                  </div>
                  <div class="risk-track"><span [style.width.%]="item.percentage"></span></div>
                  <strong>{{ item.percentage }}%</strong>
                </div>
              }
            </div>
            <a class="text-link" [routerLink]="['/drivers']" [queryParams]="{ risk: 'high' }"
              >Open high-risk drivers →</a
            >
          </section>

          <section class="panel review-preview-panel">
            <div class="panel__heading">
              <div>
                <span class="eyebrow">Operations queue</span>
                <h2>Needs review</h2>
              </div>
              <a class="text-link" routerLink="/reviews">View queue →</a>
            </div>
            @if (reviewItems().length === 0) {
              <p class="muted-copy">No drivers need a manual review in this scope.</p>
            } @else {
              <div class="review-preview-list">
                @for (item of reviewItems().slice(0, 4); track item.driver.id) {
                  <a class="review-preview-item" [routerLink]="['/drivers', item.driver.id]">
                    <span class="avatar">{{ initials(item.driver.displayName) }}</span>
                    <span>
                      <strong>{{ item.driver.displayName }}</strong>
                      <small>{{ item.reason }}</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </a>
                }
              </div>
            }
          </section>
        </div>

        <section class="panel fleet-table-panel">
          <div class="panel__heading">
            <div>
              <span class="eyebrow">Portfolio breakdown</span>
              <h2>Fleet performance</h2>
            </div>
            <span class="panel__meta">Region and risk filters apply</span>
          </div>
          <div class="table-wrap">
            <table>
              <caption class="sr-only">
                Fleet performance breakdown
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fleet</th>
                  <th scope="col">Drivers</th>
                  <th scope="col">Average score</th>
                  <th scope="col">High risk</th>
                  <th scope="col">Benefit reviews</th>
                  <th scope="col"><span class="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                @for (fleet of fleetSnapshots(); track fleet.name) {
                  <tr>
                    <td>
                      <strong>{{ fleet.name }}</strong>
                    </td>
                    <td>{{ fleet.drivers }}</td>
                    <td>
                      <strong class="score-value">{{ fleet.averageScore }}</strong
                      ><span class="score-max">/100</span>
                    </td>
                    <td>{{ fleet.highRisk }}</td>
                    <td>{{ fleet.pending }}</td>
                    <td>
                      <a
                        class="row-link"
                        [routerLink]="['/drivers']"
                        [queryParams]="{ fleet: fleet.name }"
                        >View drivers →</a
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    }
  `,
  styleUrls: [
    '../../shared/styles/data-table.shared.css',
    '../../shared/styles/filter-field.shared.css',
    '../../shared/styles/table-metadata.shared.css',
    './fleet-overview.component.css',
  ],
})
export class FleetOverviewComponent implements OnInit {
  readonly facade = inject(DriverFacade);
  readonly exporter = inject(ReportExportService);
  readonly notifications = inject(NotificationService);
  readonly fleetFilter = signal('all');
  readonly regionFilter = signal('all');
  readonly riskFilter = signal<RiskFilter>('all');

  readonly fleetOptions = computed(() =>
    [...new Set(this.facade.allDrivers().map((driver) => driver.fleetBenchmark.fleetName))].sort(),
  );
  readonly regionOptions = computed(() =>
    [...new Set(this.facade.allDrivers().map((driver) => driver.region))].sort(),
  );
  readonly filteredDrivers = computed(() => {
    const fleet = this.fleetFilter();
    const region = this.regionFilter();
    const risk = this.riskFilter();

    return this.facade.allDrivers().filter((driver) => {
      const matchesFleet = fleet === 'all' || driver.fleetBenchmark.fleetName === fleet;
      const matchesRegion = region === 'all' || driver.region === region;
      const matchesRisk = risk === 'all' || driver.riskLevel === risk;
      return matchesFleet && matchesRegion && matchesRisk;
    });
  });
  readonly summary = computed(() => {
    const drivers = this.filteredDrivers();
    return {
      averageScore: averageDriverScore(drivers),
      highRisk: drivers.filter((driver) => driver.riskLevel === 'high').length,
      pending: drivers.filter((driver) => driver.benefitDecision?.status === 'pending').length,
    };
  });
  readonly riskDistribution = computed(() => {
    const drivers = this.filteredDrivers();
    const total = drivers.length || 1;
    return (['low', 'medium', 'high'] as const).map((level) => ({
      level,
      label: `${level[0].toUpperCase()}${level.slice(1)} risk`,
      count: drivers.filter((driver) => driver.riskLevel === level).length,
      percentage: Math.round(
        (drivers.filter((driver) => driver.riskLevel === level).length / total) * 100,
      ),
    }));
  });
  readonly fleetSnapshots = computed(() => {
    const scopedDrivers = this.facade.allDrivers().filter((driver) => {
      const region = this.regionFilter();
      const risk = this.riskFilter();
      return (
        (region === 'all' || driver.region === region) &&
        (risk === 'all' || driver.riskLevel === risk)
      );
    });
    const names = [...new Set(scopedDrivers.map((driver) => driver.fleetBenchmark.fleetName))];

    return names.sort().map((name): FleetSnapshot => {
      const drivers = scopedDrivers.filter((driver) => driver.fleetBenchmark.fleetName === name);
      return {
        name,
        drivers: drivers.length,
        averageScore: averageDriverScore(drivers),
        highRisk: drivers.filter((driver) => driver.riskLevel === 'high').length,
        eligible: drivers.filter((driver) => driver.benefitDecision?.status === 'eligible').length,
        pending: drivers.filter((driver) => driver.benefitDecision?.status === 'pending').length,
      };
    });
  });
  readonly reviewItems = computed((): readonly ReviewItem[] =>
    this.filteredDrivers()
      .filter(
        (driver) => driver.riskLevel === 'high' || driver.benefitDecision?.status === 'pending',
      )
      .map((driver) => ({
        driver,
        type: driver.benefitDecision?.status === 'pending' ? 'Benefit review' : 'Risk review',
        reason:
          driver.benefitDecision?.status === 'pending'
            ? 'Benefit decision pending'
            : 'High-risk profile',
      })),
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.facade.refreshDrivers();
  }

  setFleet(event: Event): void {
    this.fleetFilter.set((event.target as HTMLSelectElement).value);
  }

  setRegion(event: Event): void {
    this.regionFilter.set((event.target as HTMLSelectElement).value);
  }

  setRisk(event: Event): void {
    this.riskFilter.set((event.target as HTMLSelectElement).value as RiskFilter);
  }

  exportReport(): void {
    const drivers = this.filteredDrivers();
    this.exporter.downloadDriversCsv(drivers, 'tmx-fleet-report.csv');
    this.notifications.show({
      tone: 'success',
      title: 'Fleet report exported',
      detail: `${drivers.length} driver records are ready as a CSV file.`,
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
