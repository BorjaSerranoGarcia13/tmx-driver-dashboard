import { ApiError } from '../../core/models/tmx.models';
import { ErrorDialogService } from './error-dialog.service';

describe('ErrorDialogService', () => {
  it('opens and closes a dialog with its recovery actions', () => {
    const service = new ErrorDialogService();
    const error: ApiError = {
      status: 403,
      title: 'Access denied',
      detail: 'You cannot view this data.',
      retryable: false,
    };

    service.show({ error, secondaryLabel: 'Back to drivers', secondary: vi.fn() });

    expect(service.dialog()?.error).toEqual(error);
    expect(service.dialog()?.secondaryLabel).toBe('Back to drivers');

    service.close();

    expect(service.dialog()).toBeNull();
  });
});
