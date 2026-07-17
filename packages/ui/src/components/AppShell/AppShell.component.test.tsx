// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NavbarItemConfig } from '../Navbar/Navbar.types';

const getNavigationItemsMock = vi.hoisted(() =>
  vi.fn<(iconSize: number) => readonly NavbarItemConfig[]>(() => []),
);

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    Outlet: () => <div data-testid='outlet'>Outlet</div>,
  };
});

vi.mock('@repo/ui/components/AppNavigation', () => ({
  AppNavigation: ({
    getNavigationItems,
  }: {
    readonly getNavigationItems: () => readonly unknown[];
  }) => <div data-testid='app-navigation'>{getNavigationItems().length}</div>,
}));

vi.mock('@repo/ui/components/NotificationCenter', () => ({
  NotificationCenter: () => (
    <div data-testid='notification-center'>Notifications</div>
  ),
}));

import { AppShell } from './AppShell.component';

describe('AppShell', () => {
  beforeEach(() => {
    getNavigationItemsMock.mockReset();
    getNavigationItemsMock.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the routed outlet and notification center', () => {
    render(<AppShell getNavigationItems={getNavigationItemsMock} />);

    expect(screen.getByTestId('outlet').textContent).toBe('Outlet');
    expect(screen.getByTestId('notification-center').textContent).toBe(
      'Notifications',
    );
    expect(screen.getByTestId('app-navigation').textContent).toBe('0');
  });

  it('exposes routed content as the one main landmark', () => {
    render(<AppShell getNavigationItems={getNavigationItemsMock} />);

    const main = screen.getByRole('main');

    expect(main.contains(screen.getByTestId('outlet'))).toBe(true);
    expect(document.querySelectorAll('main')).toHaveLength(1);
  });

  it('passes getNavigationItems into AppNavigation', () => {
    getNavigationItemsMock.mockReturnValue([{ label: 'Home', type: 'button' }]);

    render(<AppShell getNavigationItems={getNavigationItemsMock} />);

    expect(screen.getByTestId('app-navigation').textContent).toBe('1');
    expect(getNavigationItemsMock).toHaveBeenCalledTimes(1);
  });
});
