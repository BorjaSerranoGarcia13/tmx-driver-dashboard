import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/models/tmx.models';
import { ErrorDialogService } from './error-dialog.service';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  beforeEach(() => {
    // jsdom has no native top-layer modal implementation. Browser tests verify focus behavior.
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  it('explains access errors and can be dismissed', async () => {
    await TestBed.configureTestingModule({ imports: [ErrorDialogComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ErrorDialogComponent);
    const service = TestBed.inject(ErrorDialogService);
    const error: ApiError = {
      status: 403,
      title: 'Access denied',
      detail: 'Your account cannot view this data.',
      retryable: false,
    };

    service.show({ error });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'This account does not have permission to view this data',
    );
    fixture.nativeElement.querySelector('.error-dialog__close')?.click();

    expect(service.dialog()).toBeNull();
  });
});
