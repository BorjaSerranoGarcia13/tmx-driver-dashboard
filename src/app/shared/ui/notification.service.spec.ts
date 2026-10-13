import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('adds and dismisses a notification', () => {
    const service = new NotificationService();

    service.show({
      tone: 'error',
      title: 'Unable to refresh data',
      detail: 'Showing the last successful version.',
      durationMs: 0,
    });

    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].title).toBe('Unable to refresh data');

    service.dismiss(service.notifications()[0].id);

    expect(service.notifications()).toHaveLength(0);
  });
});
