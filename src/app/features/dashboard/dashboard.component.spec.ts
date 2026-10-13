import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { DriverFacade } from '../drivers/store/driver.facade';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('renders portfolio metrics and requests data on init', async () => {
    const facade = {
      drivers: signal(DRIVER_FIXTURES.slice(0, 1)),
      allDrivers: signal(DRIVER_FIXTURES),
      selectedDriver: signal(null),
      summary: signal({
        totalDrivers: 7,
        averageScore: 78,
        eligibleBenefits: 5,
        highRiskDrivers: 2,
      }),
      loading: signal(false),
      detailLoading: signal(false),
      error: signal(null),
      detailError: signal(null),
      query: signal(''),
      riskFilter: signal('all'),
      sort: signal('score-desc'),
      refreshDrivers: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DriverFacade, useValue: facade }, provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Driver portfolio');
    expect(fixture.nativeElement.textContent).toContain('Drivers monitored');
    expect(fixture.nativeElement.textContent).toContain('Safe braking');
    expect(fixture.nativeElement.textContent).toContain('not score weights');
    expect(fixture.nativeElement.textContent).toContain('Eligible benefits');
    for (const copy of [
      'Annual view',
      'Annual portfolio view',
      'Benefits in the current data',
      'A compact view',
      'Review first',
    ]) {
      expect(fixture.nativeElement.textContent).not.toContain(copy);
    }
    expect(
      fixture.componentInstance.riskDistribution().reduce((sum, row) => sum + row.count, 0),
    ).toBe(7);
    expect(facade.refreshDrivers).toHaveBeenCalledOnce();
  });
});
