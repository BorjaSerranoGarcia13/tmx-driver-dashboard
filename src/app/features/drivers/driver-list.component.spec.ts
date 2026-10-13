import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { DriverFacade } from './store/driver.facade';
import { DriverListComponent } from './driver-list.component';

function createFacade() {
  return {
    drivers: signal(DRIVER_FIXTURES.slice(0, 2)),
    allDrivers: signal(DRIVER_FIXTURES),
    selectedDriver: signal(null),
    summary: signal({ totalDrivers: 2, averageScore: 78, eligibleBenefits: 1, highRiskDrivers: 1 }),
    loading: signal(false),
    detailLoading: signal(false),
    error: signal(null),
    detailError: signal(null),
    query: signal(''),
    fleetFilter: signal('all'),
    riskFilter: signal('all'),
    sort: signal('score-desc'),
    refreshDrivers: vi.fn(),
    setQuery: vi.fn(),
    setFleet: vi.fn(),
    setRiskFilter: vi.fn(),
    setSort: vi.fn(),
  };
}

describe('DriverListComponent', () => {
  it('renders the driver table and refreshes on init', async () => {
    const facade = createFacade();
    await TestBed.configureTestingModule({
      imports: [DriverListComponent],
      providers: [{ provide: DriverFacade, useValue: facade }, provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverListComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(DRIVER_FIXTURES[0].displayName);
    expect(facade.refreshDrivers).toHaveBeenCalledOnce();
  });

  it('renders an empty state when filters remove every driver', async () => {
    const facade = createFacade();
    facade.drivers.set([]);
    await TestBed.configureTestingModule({
      imports: [DriverListComponent],
      providers: [{ provide: DriverFacade, useValue: facade }, provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverListComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No drivers match these filters');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });
});
