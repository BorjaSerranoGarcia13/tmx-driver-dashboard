import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { Driver } from '../../core/models/tmx.models';
import { ReviewWorkFacade } from '../workspace/store/review-work.facade';
import { ReviewEditorComponent } from '../workspace/review-editor.component';
import { DriverDetailComponent } from './driver-detail.component';
import { DriverFacade } from './store/driver.facade';
import { pendingReviewGuard } from './pending-review.guard';

describe('Driver detail routing', () => {
  it('loads changed route parameters on the same component instance', async () => {
    const selectedDriver = signal<Driver | null>(null);
    const loadDriver = vi.fn((id: string) =>
      selectedDriver.set(DRIVER_FIXTURES.find((driver) => driver.id === id) ?? null),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'drivers/:id',
            component: DriverDetailComponent,
            canDeactivate: [pendingReviewGuard],
          },
        ]),
        {
          provide: DriverFacade,
          useValue: {
            selectedDriver,
            detailLoading: signal(false),
            detailError: signal(null),
            loadDriver,
          },
        },
        {
          provide: ReviewWorkFacade,
          useValue: {
            items: signal([]),
            hydrated: signal(true),
            saving: signal(false),
            error: signal(null),
            upsert: vi.fn(),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl(
      '/drivers/' + DRIVER_FIXTURES[0].id,
      DriverDetailComponent,
    );
    const second = await harness.navigateByUrl(
      '/drivers/' + DRIVER_FIXTURES[1].id,
      DriverDetailComponent,
    );
    await harness.fixture.whenStable();
    expect(second).toBe(first);
    expect(loadDriver).toHaveBeenLastCalledWith(DRIVER_FIXTURES[1].id);
    expect(harness.routeNativeElement?.textContent).toContain(DRIVER_FIXTURES[1].displayName);
    expect(second.driverId()).toBe(DRIVER_FIXTURES[1].id);
    const editor = harness.routeDebugElement?.query(By.directive(ReviewEditorComponent))
      .componentInstance as ReviewEditorComponent;
    editor.reviewForm.note().value.set('Keep this draft');
    await harness.fixture.whenStable();
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    await harness.navigateByUrl('/drivers/' + DRIVER_FIXTURES[0].id, DriverDetailComponent);
    expect(confirm).toHaveBeenCalled();
    expect(second.driverId()).toBe(DRIVER_FIXTURES[1].id);
    expect(editor.draft().note).toBe('Keep this draft');
    confirm.mockRestore();
  });
});
