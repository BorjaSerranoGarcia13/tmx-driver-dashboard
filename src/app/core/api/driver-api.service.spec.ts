import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DemoScenarioService } from './demo-scenario.service';
import { DriverApiService } from './driver-api.service';
import { mockApiInterceptor } from './mock-api.interceptor';

describe('DriverApiService', () => {
  let api: DriverApiService;
  let scenario: DemoScenarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor])), DemoScenarioService],
    });
    api = TestBed.inject(DriverApiService);
    scenario = TestBed.inject(DemoScenarioService);
  });

  it('returns the driver collection through the HTTP boundary', async () => {
    const drivers = await firstValueFrom(api.getDrivers());

    expect(drivers.length).toBeGreaterThan(1);
    expect(drivers[0].id).toMatch(/^tmx-/);
  });

  it('surfaces the selected API error scenario', async () => {
    scenario.setScenario('server-error');

    await expect(firstValueFrom(api.getDrivers())).rejects.toMatchObject({ status: 500 });
  });
});
