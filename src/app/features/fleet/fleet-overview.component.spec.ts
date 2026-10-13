import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { DriverFacade } from '../drivers/store/driver.facade';
import { FleetOverviewComponent } from './fleet-overview.component';

describe('FleetOverviewComponent', () => {
  it('renders fleet metrics and requests data on init', async () => {
    const facade = {
      allDrivers: signal(DRIVER_FIXTURES),
      loading: signal(false),
      error: signal(null),
      refreshDrivers: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [FleetOverviewComponent],
      providers: [{ provide: DriverFacade, useValue: facade }, provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(FleetOverviewComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Fleet overview');
    expect(fixture.nativeElement.textContent).toContain('Northstar Mobility');
    expect(fixture.nativeElement.textContent).toContain('Benefit reviews');
    expect(facade.refreshDrivers).toHaveBeenCalledOnce();
  });
});
