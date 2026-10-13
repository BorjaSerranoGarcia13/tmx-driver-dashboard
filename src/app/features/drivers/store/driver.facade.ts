import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DriverSort, RiskFilter } from '../../../core/models/tmx.models';
import * as DriverActions from './driver.actions';
import {
  selectDetailError,
  selectDetailLoading,
  selectDriversError,
  selectDriversLoading,
  selectDrivers,
  selectFleetFilter,
  selectQuery,
  selectRiskFilter,
  selectSelectedDriver,
  selectSort,
  selectSummary,
  selectVisibleDrivers,
} from './driver.selectors';

@Injectable({ providedIn: 'root' })
export class DriverFacade {
  private readonly store = inject(Store);

  readonly drivers = this.store.selectSignal(selectVisibleDrivers);
  readonly allDrivers = this.store.selectSignal(selectDrivers);
  readonly selectedDriver = this.store.selectSignal(selectSelectedDriver);
  readonly summary = this.store.selectSignal(selectSummary);
  readonly loading = this.store.selectSignal(selectDriversLoading);
  readonly detailLoading = this.store.selectSignal(selectDetailLoading);
  readonly error = this.store.selectSignal(selectDriversError);
  readonly detailError = this.store.selectSignal(selectDetailError);
  readonly query = this.store.selectSignal(selectQuery);
  readonly fleetFilter = this.store.selectSignal(selectFleetFilter);
  readonly riskFilter = this.store.selectSignal(selectRiskFilter);
  readonly sort = this.store.selectSignal(selectSort);

  refreshDrivers(): void {
    this.store.dispatch(DriverActions.loadDrivers());
  }

  loadDriver(id: string): void {
    this.store.dispatch(DriverActions.loadDriver({ id }));
  }

  setQuery(query: string): void {
    this.store.dispatch(DriverActions.setQuery({ query }));
  }

  setFleet(fleetFilter: string): void {
    this.store.dispatch(DriverActions.setFleet({ fleetFilter }));
  }

  setRiskFilter(riskFilter: RiskFilter): void {
    this.store.dispatch(DriverActions.setRiskFilter({ riskFilter }));
  }

  setSort(sort: DriverSort): void {
    this.store.dispatch(DriverActions.setSort({ sort }));
  }
}
