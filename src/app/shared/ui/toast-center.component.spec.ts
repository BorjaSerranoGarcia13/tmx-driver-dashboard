import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { ToastCenterComponent } from './toast-center.component';

describe('ToastCenterComponent', () => {
  it('renders a dismissible notification with its action', async () => {
    await TestBed.configureTestingModule({ imports: [ToastCenterComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ToastCenterComponent);
    const service = TestBed.inject(NotificationService);
    const action = vi.fn();

    service.show({
      tone: 'error',
      title: 'Unable to refresh data',
      detail: 'Showing the last successful version.',
      actionLabel: 'Try again',
      action,
      durationMs: 0,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to refresh data');
    fixture.nativeElement.querySelector('.toast__copy button')?.click();

    expect(action).toHaveBeenCalledOnce();
    expect(service.notifications()).toHaveLength(0);
  });
});
