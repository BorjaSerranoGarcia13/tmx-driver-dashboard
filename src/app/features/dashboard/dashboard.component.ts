import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Driver } from '../../core/models/tmx.models';
import { ErrorPanelComponent } from '../../shared/ui/error-panel.component';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
import { DriverFacade } from '../drivers/store/driver.facade';

import {
  benefitDecisions,
  decisionStatus,
  portfolioCriteria,
  riskDistribution,
} from '../../core/models/portfolio';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, ErrorPanelComponent, LoadingBlockComponent, StatusPillComponent],
  template: `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Portfolio overview</span>
        <h1>Driver portfolio</h1>
        <p>Monitor driver information, behaviour signals and benefit eligibility.</p>
      </div>
      <div class="page-actions">
        <button class="button button--primary" type="button" (click)="refresh()">
          <span aria-hidden="true">↻</span> Refresh data
        </button>
      </div>
    </section>

    @if (facade.loading()) {
      <div class="dashboard-grid dashboard-grid--summary">
        <app-loading-block [height]="106" />
        <app-loading-block [height]="106" />
        <app-loading-block [height]="106" />
        <app-loading-block [height]="106" />
      </div>
      <app-loading-block [height]="340" />
    } @else {
      @if (facade.error(); as error) {
        @if (facade.summary().totalDrivers > 0) {
          <app-error-panel [error]="error" [compact]="true" (retry)="refresh()" />
        } @else {
          <app-error-panel [error]="error" (retry)="refresh()" />
        }
      }
      <section class="summary-strip" aria-label="Portfolio summary">
        <article class="summary-item">
          <span class="summary-item__label">Drivers monitored</span>
          <strong>{{ facade.summary().totalDrivers }}</strong>
        </article>
        <article class="summary-item">
          <span class="summary-item__label">Average behaviour index</span>
          <strong>{{ facade.summary().averageScore }}</strong>
        </article>
        <article class="summary-item">
          <span class="summary-item__label">Eligible benefits</span>
          <strong>{{ facade.summary().eligibleBenefits }}</strong>
        </article>
        <div class="summary-distribution">
          <span class="summary-item__label">Behaviour distribution</span>
          <div class="distribution-bar" aria-label="Driver behaviour distribution">
            @for (item of riskDistribution(); track item.level) {
              <span
                [class]="'distribution-bar__segment distribution-bar__segment--' + item.level"
                [style.width.%]="item.percentage"
              ></span>
            }
          </div>
          <div class="distribution-legend">
            @for (item of riskDistribution(); track item.level) {
              <span>
                <i [class]="'legend-dot legend-dot--' + item.level"></i>{{ item.label }}
                <strong>{{ item.count }}</strong>
              </span>
            }
          </div>
        </div>
      </section>

      <div class="dashboard-grid dashboard-grid--main">
        <section class="panel behaviour-panel">
          <div class="panel__heading">
            <div>
              <span class="eyebrow">Behaviour signals</span>
              <h2>Annual behaviour index</h2>
            </div>
          </div>
          <div class="behaviour-summary">
            <div>
              <strong>{{ facade.summary().averageScore }}</strong>
              <span>portfolio average</span>
            </div>
          </div>
          <div class="criteria-list" aria-label="Driving criteria">
            @for (criterion of drivingCriteria(); track criterion.label) {
              <div class="criterion-row">
                <div class="criterion-heading">
                  <div>
                    <strong>{{ criterion.label }}</strong>
                    <span>{{ criterion.met }} of {{ criterion.evaluated }} meet target</span>
                  </div>
                  <div class="criterion-result">
                    <strong>{{ criterion.percentage }}%</strong>
                    <span>meet target</span>
                  </div>
                </div>
                <div class="criterion-track" aria-hidden="true">
                  <span class="criterion-fill" [style.width.%]="criterion.percentage"></span>
                </div>
              </div>
            }
          </div>
          <div class="criteria-note">
            <span>Percentages show drivers meeting each target, not score weights.</span>
          </div>
        </section>

        <section class="panel decisions-panel">
          <div class="panel__heading">
            <div>
              <span class="eyebrow">Benefits</span>
              <h2>Benefit decisions</h2>
            </div>
            <a class="text-link" routerLink="/drivers">View all →</a>
          </div>
          <div class="decision-list">
            @for (decision of benefitDecisions(); track decision.status) {
              <div class="decision-row">
                <span
                  [class]="'decision-icon decision-icon--' + decision.status"
                  aria-hidden="true"
                >
                  {{
                    decision.status === 'eligible' ? '✓' : decision.status === 'pending' ? '·' : '—'
                  }}
                </span>
                <div class="decision-row__copy">
                  <strong>{{ decision.label }}</strong>
                  <small>{{ decision.detail }}</small>
                </div>
                <div class="decision-row__count">
                  <strong>{{ decision.count }}</strong>
                  <small>{{ decision.percentage }}%</small>
                </div>
              </div>
            }
          </div>
        </section>
      </div>

      <section class="table-panel recent-panel">
        <div class="table-panel__header">
          <div>
            <span class="eyebrow">Latest activity</span>
            <h2>Recent driver changes</h2>
          </div>
          <a class="text-link" routerLink="/drivers">View all drivers →</a>
        </div>
        <div class="table-wrap">
          <table>
            <caption class="sr-only">
              Recent driver behaviour changes
            </caption>
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">Behaviour</th>
                <th scope="col">Decision</th>
                <th scope="col">Last updated</th>
                <th scope="col"><span class="sr-only">Open profile</span></th>
              </tr>
            </thead>
            <tbody>
              @for (driver of recentDrivers(); track driver.id) {
                <tr>
                  <td>
                    <a class="driver-cell" [routerLink]="['/drivers', driver.id]">
                      <span class="avatar">{{ initials(driver.displayName) }}</span>
                      <span>
                        <strong>{{ driver.displayName }}</strong>
                        <small>{{ driver.id }} · {{ driver.region }}</small>
                      </span>
                    </a>
                  </td>
                  <td>
                    <strong class="score-value">{{ driver.score }}</strong>
                    <span class="score-max">/100 · </span>
                    <app-status-pill [value]="driver.trend" [label]="driver.trend" />
                  </td>
                  <td>
                    <app-status-pill
                      [value]="decisionStatus(driver)"
                      [label]="decisionLabel(driver)"
                    />
                  </td>
                  <td>{{ driver.lastUpdated | date: 'dd MMM yyyy' }}</td>
                  <td>
                    <a class="row-link" [routerLink]="['/drivers', driver.id]">Open profile →</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styleUrls: [
    '../../shared/styles/data-table.shared.css',
    '../../shared/styles/driver-identity.shared.css',
    '../../shared/styles/table-metadata.shared.css',
    './dashboard.component.css',
  ],
})
export class DashboardComponent implements OnInit {
  readonly facade = inject(DriverFacade);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.facade.refreshDrivers();
  }

  readonly recentDrivers = computed(() =>
    [...this.facade.allDrivers()]
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      .slice(0, 4),
  );
  readonly riskDistribution = computed(() => riskDistribution(this.facade.allDrivers()));
  readonly drivingCriteria = computed(() => portfolioCriteria(this.facade.allDrivers()));
  readonly benefitDecisions = computed(() => benefitDecisions(this.facade.allDrivers()));

  decisionLabel(driver: Driver): string {
    const status = decisionStatus(driver);
    return status === 'eligible'
      ? 'Eligible'
      : status === 'pending'
        ? 'Under review'
        : 'Not eligible';
  }
  readonly decisionStatus = decisionStatus;

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }
}
