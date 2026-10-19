// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { AppNotification } from '#ui/contexts/NotificationContext';

const { dismissNotificationMock, notificationsRef, showPopoverMock } =
  vi.hoisted(() => ({
    dismissNotificationMock: vi.fn(),
    notificationsRef: { current: [] as readonly AppNotification[] },
    showPopoverMock: vi.fn(),
  }));

const INVALID_FILTERS: AppNotification = {
  durationMs: 3000,
  id: 'n-1',
  message: 'Fix invalid filters before accepting table settings.',
  placement: 'bottom-right',
  title: 'Invalid filters',
  variant: 'warning',
};

const SAVED: AppNotification = {
  durationMs: 3000,
  id: 'n-2',
  message: 'Settings saved.',
  placement: 'top-left',
  title: 'Saved',
  variant: 'success',
};

const originalShowPopoverDescriptorRef: {
  current: PropertyDescriptor | undefined;
} = {
  current: undefined,
};

beforeEach(() => {
  dismissNotificationMock.mockReset();
  showPopoverMock.mockReset();
  notificationsRef.current = [INVALID_FILTERS];

  originalShowPopoverDescriptorRef.current = Object.getOwnPropertyDescriptor(
    HTMLDivElement.prototype,
    'showPopover',
  );

  Object.defineProperty(HTMLDivElement.prototype, 'showPopover', {
    configurable: true,
    value: showPopoverMock,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDivElement.prototype, 'hidePopover');

  if (originalShowPopoverDescriptorRef.current) {
    Object.defineProperty(
      HTMLDivElement.prototype,
      'showPopover',
      originalShowPopoverDescriptorRef.current,
    );
    return;
  }

  Reflect.deleteProperty(HTMLDivElement.prototype, 'showPopover');
});

vi.mock('#ui/contexts/NotificationContext/actions', () => ({
  useDismissNotificationAction: () => dismissNotificationMock,
}));

vi.mock('#ui/contexts/NotificationContext/selectors', () => ({
  useGetNotifications: () => notificationsRef.current,
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

  it('opens a corner once, when it first holds a notification', () => {
    const { rerender } = render(<NotificationCenter />);

    expect(showPopoverMock).toHaveBeenCalledOnce();

    notificationsRef.current = [INVALID_FILTERS, SAVED];
    rerender(<NotificationCenter />);

    expect(showPopoverMock).toHaveBeenCalledTimes(2);

    notificationsRef.current = [SAVED, INVALID_FILTERS];
    rerender(<NotificationCenter />);

    expect(showPopoverMock).toHaveBeenCalledTimes(2);
  });

  it('opens a corner again after it emptied and refilled', () => {
    const { rerender } = render(<NotificationCenter />);

    notificationsRef.current = [SAVED];
    rerender(<NotificationCenter />);

    notificationsRef.current = [SAVED, INVALID_FILTERS];
    rerender(<NotificationCenter />);

    expect(showPopoverMock).toHaveBeenCalledTimes(3);
  });

  it('leaves its corner open under StrictMode without re-opening an open popover', () => {
    const openViewports = new WeakSet<Element>();
    vi.spyOn(Element.prototype, 'matches').mockImplementation(
      function isPopoverOpen(this: Element) {
        return openViewports.has(this);
      },
    );
    const hidePopover = vi.fn(function hide(this: Element) {
      openViewports.delete(this);
    });
    Object.defineProperty(HTMLDivElement.prototype, 'hidePopover', {
      configurable: true,
      value: hidePopover,
    });
    showPopoverMock.mockImplementation(function show(this: Element) {
      if (openViewports.has(this)) {
        throw new DOMException('Already showing', 'InvalidStateError');
      }

      openViewports.add(this);
    });

    expect(() =>
      render(
        <StrictMode>
          <NotificationCenter />
        </StrictMode>,
      ),
    ).not.toThrow();

    const viewport = screen.getByText('Invalid filters').closest('[popover]');

    expect(viewport).not.toBeNull();
    expect(viewport?.matches(':popover-open')).toBe(true);
  });
});
