import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { ReviewWorkFacade } from '../workspace/store/review-work.facade';
import { DriverFacade } from '../drivers/store/driver.facade';
import { ReviewQueueComponent } from './review-queue.component';

describe('ReviewQueueComponent', () => {
  it('shows benefit and risk work items', async () => {
    const facade = {
      allDrivers: signal(DRIVER_FIXTURES),
      loading: signal(false),
      error: signal(null),
      refreshDrivers: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewQueueComponent],
      providers: [
        { provide: DriverFacade, useValue: facade },
        {
          provide: ReviewWorkFacade,
          useValue: { items: signal([]), upsert: vi.fn(), remove: vi.fn() },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReviewQueueComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Review queue');
    expect(fixture.nativeElement.textContent).toContain('Benefit decision');
    expect(fixture.nativeElement.textContent).toContain('Risk profile');
    expect(facade.refreshDrivers).toHaveBeenCalledOnce();
  });
});
