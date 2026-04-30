// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dismissNotificationMock, notificationsMock, showPopoverMock } =
  vi.hoisted(() => ({
    dismissNotificationMock: vi.fn(),
    notificationsMock: [
      {
        durationMs: 3000,
        id: 'n-1',
        message: 'Fix invalid filters before accepting table settings.',
        placement: 'bottom-right',
        title: 'Invalid filters',
        variant: 'warning',
      },
    ],
    showPopoverMock: vi.fn(),
  }));

beforeEach(() => {
  dismissNotificationMock.mockReset();
  showPopoverMock.mockReset();

  Object.defineProperty(HTMLDivElement.prototype, 'showPopover', {
    configurable: true,
    value: showPopoverMock,
  });
});

afterEach(() => {
  cleanup();
});

vi.mock('@/hooks/useNotifications.hook', () => ({
  useNotifications: () => ({
    dismissNotification: dismissNotificationMock,
    notifications: notificationsMock,
  }),
}));

import { NotificationCenter } from './NotificationCenter.component';

describe('NotificationCenter', () => {
  it('renders notification message and dismisses notification from button click', () => {
    render(<NotificationCenter />);

    expect(showPopoverMock).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Invalid filters').textContent).toBe(
      'Invalid filters',
    );
    expect(
      screen.getByText('Fix invalid filters before accepting table settings.')
        .textContent,
    ).toContain('Fix invalid filters before accepting table settings.');

    fireEvent.click(
      screen.getByRole('button', {
        hidden: true,
        name: 'Dismiss notification',
      }),
    );

    expect(dismissNotificationMock).toHaveBeenCalledWith('n-1');
  });
});
