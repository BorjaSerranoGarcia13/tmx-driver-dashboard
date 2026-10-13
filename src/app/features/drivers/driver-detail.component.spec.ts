import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DRIVER_FIXTURES } from '../../core/data/driver-fixtures';
import { ReviewWorkFacade } from '../workspace/store/review-work.facade';
import { DriverFacade } from './store/driver.facade';
import { DriverDetailComponent } from './driver-detail.component';

describe('DriverDetailComponent', () => {
  it('loads and renders a selected driver profile', async () => {
    const driver = DRIVER_FIXTURES[0];
    const facade = {
      selectedDriver: signal(driver),
      detailLoading: signal(false),
      detailError: signal(null),
      loadDriver: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [DriverDetailComponent],
      providers: [
        { provide: DriverFacade, useValue: facade },
        {
          provide: ReviewWorkFacade,
          useValue: {
            items: signal([]),
            hydrated: signal(true),
            saving: signal(false),
            error: signal(null),
            upsert: vi.fn(),
            remove: vi.fn(),
          },
        },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: driver.id })) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(driver.displayName);
    expect(fixture.nativeElement.textContent).toContain('Behaviour snapshot');
    expect(fixture.nativeElement.textContent).toContain('Why this outcome?');
    expect(fixture.nativeElement.textContent).toContain(driver.benefitDecision?.benefitLabel);
    expect(fixture.nativeElement.textContent).toContain('Decision history');
    expect(facade.loadDriver).toHaveBeenCalledWith(driver.id);
  });

  it('filters the score history by the selected period', async () => {
    const driver = DRIVER_FIXTURES[0];
    const facade = {
      selectedDriver: signal(driver),
      detailLoading: signal(false),
      detailError: signal(null),
      loadDriver: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [DriverDetailComponent],
      providers: [
        { provide: DriverFacade, useValue: facade },
        {
          provide: ReviewWorkFacade,
          useValue: {
            items: signal([]),
            hydrated: signal(true),
            saving: signal(false),
            error: signal(null),
            upsert: vi.fn(),
            remove: vi.fn(),
          },
        },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: driver.id })) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverDetailComponent);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      '.range-control select',
    ) as HTMLSelectElement;

    select.value = '3m';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.history-column')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('+2 points');
  });
});
