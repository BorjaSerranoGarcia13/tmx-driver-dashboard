import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Driver, DriverSort, RiskFilter } from '../../core/models/tmx.models';
import { DriverFacade } from './store/driver.facade';
import { ErrorPanelComponent } from '../../shared/ui/error-panel.component';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';

@Component({
  selector: 'app-driver-list',
  imports: [RouterLink, ErrorPanelComponent, LoadingBlockComponent, StatusPillComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Driver portfolio</span>
        <h1>Drivers</h1>
        <p>Search the TMX driver portfolio and inspect behaviour signals.</p>
      </div>
      <button class="button button--ghost filter-toggle" type="button" (click)="toggleFilters()">
        {{ filtersOpen() ? 'Hide filters' : 'Show filters' }}
      </button>
    </section>

    <section
      class="filter-bar"
      [class.filter-bar--open]="filtersOpen()"
      aria-label="Driver filters"
    >
      <label class="field field--search"
        ><span>Search</span
        ><input
          type="search"
          [value]="facade.query()"
          (input)="setQuery($event)"
          placeholder="Name, ID or region"
      /></label>
      <label class="field"
        ><span>Fleet</span
        ><select [value]="facade.fleetFilter()" (change)="setFleet($event)">
          <option value="all">All fleets</option>
          @for (fleet of fleetOptions(); track fleet) {
            <option [value]="fleet">{{ fleet }}</option>
          }
        </select></label
      >
      <label class="field"
        ><span>Risk level</span
        ><select [value]="facade.riskFilter()" (change)="setRiskFilter($event)">
          <option value="all">All levels</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select></label
      >
      <label class="field"
        ><span>Sort by</span
        ><select [value]="facade.sort()" (change)="setSort($event)">
          <option value="score-desc">Highest score</option>
          <option value="score-asc">Lowest score</option>
          <option value="name-asc">Name A–Z</option>
        </select></label
      >
      <div class="filter-bar__meta">
        <strong>{{ facade.drivers().length }}</strong
        ><span>visible drivers</span>
      </div>
    </section>

    @if (facade.loading()) {
      <app-loading-block [height]="420" />
    } @else {
      @if (facade.error(); as error) {
        @if (facade.summary().totalDrivers > 0) {
          <app-error-panel [error]="error" [compact]="true" (retry)="refresh()" />
        } @else {
          <app-error-panel [error]="error" (retry)="refresh()" />
        }
      }
      @if (facade.drivers().length === 0 && !facade.error()) {
        <section class="empty-panel">
          <span class="empty-panel__icon">⌕</span>
          <h2>No drivers match these filters</h2>
          <p>Try a different search or clear the current filter.</p>
          <button class="button button--primary" type="button" (click)="clearFilters()">
            Clear filters
          </button>
        </section>
      } @else if (facade.drivers().length > 0) {
        <section class="table-panel">
          <div class="table-panel__header">
            <div>
              <span class="eyebrow">Live view</span>
              <h2>Driver signals</h2>
            </div>
            <button class="button button--ghost" type="button" (click)="refresh()">Refresh</button>
          </div>
          <div class="table-wrap">
            <table>
              <caption class="sr-only">
                Driver behaviour signals
              </caption>
              <thead>
                <tr>
                  <th scope="col">Driver</th>
                  <th scope="col">Score</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Trend</th>
                  <th scope="col">Benefits</th>
                  <th scope="col"><span class="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                @for (driver of facade.drivers(); track driver.id) {
                  <tr>
                    <td>
                      <a class="driver-cell" [routerLink]="['/drivers', driver.id]"
                        ><span class="avatar">{{ initials(driver.displayName) }}</span
                        ><span
                          ><strong>{{ driver.displayName }}</strong
                          ><small>{{ driver.id }} · {{ driver.region }}</small></span
                        ></a
                      >
                    </td>
                    <td>
                      <strong class="score-value">{{ driver.score }}</strong
                      ><span class="score-max">/100</span>
                    </td>
                    <td>
                      <app-status-pill
                        [value]="driver.riskLevel"
                        [label]="driver.riskLevel + ' risk'"
                      />
                    </td>
                    <td><app-status-pill [value]="driver.trend" [label]="driver.trend" /></td>
                    <td>{{ eligibleBenefits(driver) }}</td>
                    <td>
                      <a class="row-link" [routerLink]="['/drivers', driver.id]"
                        >View <span aria-hidden="true">→</span></a
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
    '../../shared/styles/driver-identity.shared.css',
    '../../shared/styles/filter-field.shared.css',
    '../../shared/styles/table-metadata.shared.css',
    '../../shared/styles/empty-state.shared.css',
    './driver-list.component.css',
  ],
})
export class DriverListComponent implements OnInit {
  readonly facade = inject(DriverFacade);
  readonly filtersOpen = signal(true);
  readonly fleetOptions = computed(() =>
    [...new Set(this.facade.allDrivers().map((driver) => driver.fleetBenchmark.fleetName))].sort(),
  );
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const fleet = this.route.snapshot.queryParamMap.get('fleet');
    if (fleet) this.facade.setFleet(fleet);
    const risk = this.route.snapshot.queryParamMap.get('risk') as RiskFilter | null;
    if (risk === 'low' || risk === 'medium' || risk === 'high') {
      this.facade.setRiskFilter(risk);
    }
    this.refresh();
  }
  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }
  refresh(): void {
    this.facade.refreshDrivers();
  }
  setQuery(event: Event): void {
    this.facade.setQuery((event.target as HTMLInputElement).value);
  }
  setRiskFilter(event: Event): void {
    this.facade.setRiskFilter((event.target as HTMLSelectElement).value as RiskFilter);
  }
  setFleet(event: Event): void {
    this.facade.setFleet((event.target as HTMLSelectElement).value);
  }
  setSort(event: Event): void {
    this.facade.setSort((event.target as HTMLSelectElement).value as DriverSort);
  }
  clearFilters(): void {
    this.facade.setQuery('');
    this.facade.setFleet('all');
    this.facade.setRiskFilter('all');
  }
  eligibleBenefits(driver: Driver): string {
    return `${driver.benefits.filter((benefit) => benefit.status === 'eligible').length} eligible`;
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
