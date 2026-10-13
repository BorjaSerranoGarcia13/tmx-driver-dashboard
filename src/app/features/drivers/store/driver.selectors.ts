import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DriverSummary } from '../../../core/models/tmx.models';
import { DriverState } from './driver.reducer';

export const selectDriverState = createFeatureSelector<DriverState>('drivers');
export const selectDrivers = createSelector(selectDriverState, (state) => state.items);
export const selectSelectedDriver = createSelector(selectDriverState, (state) => state.selected);
export const selectDriversLoading = createSelector(selectDriverState, (state) => state.loading);
export const selectDetailLoading = createSelector(
  selectDriverState,
  (state) => state.detailLoading,
);
export const selectDriversError = createSelector(selectDriverState, (state) => state.error);
export const selectDetailError = createSelector(selectDriverState, (state) => state.detailError);
export const selectQuery = createSelector(selectDriverState, (state) => state.query);
export const selectFleetFilter = createSelector(selectDriverState, (state) => state.fleetFilter);
export const selectRiskFilter = createSelector(selectDriverState, (state) => state.riskFilter);
export const selectSort = createSelector(selectDriverState, (state) => state.sort);

export const selectVisibleDrivers = createSelector(
  selectDrivers,
  selectQuery,
  selectRiskFilter,
  selectFleetFilter,
  selectSort,
  (items, search, riskFilter, fleetFilter, sort) => {
    const query = search.trim().toLowerCase();
    const visible = items.filter((driver) => {
      const matchesQuery =
        !query ||
        driver.displayName.toLowerCase().includes(query) ||
        driver.id.toLowerCase().includes(query) ||
        driver.region.toLowerCase().includes(query);
      const matchesRisk = riskFilter === 'all' || driver.riskLevel === riskFilter;
      const matchesFleet = fleetFilter === 'all' || driver.fleetBenchmark.fleetName === fleetFilter;
      return matchesQuery && matchesRisk && matchesFleet;
    });

    return [...visible].sort((first, second) => {
      if (sort === 'name-asc') return first.displayName.localeCompare(second.displayName);
      if (sort === 'score-asc') return first.score - second.score;
      return second.score - first.score;
    });
  },
);

export const selectSummary = createSelector(selectDrivers, (drivers): DriverSummary => ({
  totalDrivers: drivers.length,
  averageScore: drivers.length
    ? Math.round(drivers.reduce((total, driver) => total + driver.score, 0) / drivers.length)
    : 0,
  eligibleBenefits: drivers.reduce(
    (total, driver) =>
      total + driver.benefits.filter((benefit) => benefit.status === 'eligible').length,
    0,
  ),
  highRiskDrivers: drivers.filter((driver) => driver.riskLevel === 'high').length,
}));
