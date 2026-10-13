import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../core/models/tmx.models';
import { ErrorPanelComponent } from './error-panel.component';

describe('ErrorPanelComponent', () => {
  const error: ApiError = {
    status: 500,
    title: 'The service is unavailable',
    detail: 'Retry the request.',
    retryable: true,
  };

  it('renders retryable API errors and emits retry', async () => {
    await TestBed.configureTestingModule({ imports: [ErrorPanelComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ErrorPanelComponent);
    const retry = vi.fn();

    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.nativeElement.querySelector('button')?.click();

    expect(fixture.nativeElement.textContent).toContain('The service is unavailable');
    expect(retry).toHaveBeenCalledOnce();
  });
});
