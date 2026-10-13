import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { ReviewWorkItem } from '../../core/models/review-work.models';
import { DriverFacade } from '../drivers/store/driver.facade';
import { ReviewWorkFacade } from './store/review-work.facade';
import { WorkspaceComponent } from './workspace.component';

describe('WorkspaceComponent', () => {
  const item: ReviewWorkItem = {
    driverId: DRIVER_FIXTURES[0].id,
    status: 'follow-up',
    note: 'Call tomorrow',
    createdAt: '2026-10-12',
    updatedAt: '2026-10-12',
  };
  async function setup(error: string | null = null) {
    const work = {
      items: signal([item]),
      error: signal(error),
      remove: vi.fn(),
      clear: vi.fn(),
      hydrate: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: DriverFacade,
          useValue: {
            allDrivers: signal(DRIVER_FIXTURES),
            loading: signal(false),
            error: signal(null),
            refreshDrivers: vi.fn(),
          },
        },
        { provide: ReviewWorkFacade, useValue: work },
      ],
    });
    const fixture = TestBed.createComponent(WorkspaceComponent);
    await fixture.whenStable();
    return { fixture, work };
  }
  it('renders saved work and filters without changing committed items', async () => {
    const { fixture, work } = await setup();
    expect(fixture.nativeElement.textContent).toContain('Call tomorrow');
    fixture.componentInstance.statusFilter.set('done');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No saved reviews match');
    expect(work.items()).toEqual([item]);
  });
  it('exposes storage failure with a retry and preserves existing records', async () => {
    const { fixture, work } = await setup('Storage blocked');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Storage blocked',
    );
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    expect(work.hydrate).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Call tomorrow');
  });
  it('dispatches remove/clear intent without announcing unconfirmed success', async () => {
    const { fixture, work } = await setup();
    fixture.componentInstance.remove(item);
    fixture.componentInstance.clearWorkspace();
    expect(work.remove).toHaveBeenCalledWith(item.driverId);
    expect(work.clear).toHaveBeenCalledOnce();
    expect(work.items()).toEqual([item]);
  });
});
