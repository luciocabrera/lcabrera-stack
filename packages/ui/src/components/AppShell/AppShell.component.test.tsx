// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    Outlet: () => <div data-testid='outlet'>Outlet</div>,
  };
});

vi.mock('#ui/components/AppNavigation', () => ({
  AppNavigation: () => <div data-testid='app-navigation'>AppNavigation</div>,
}));

vi.mock('#ui/components/NotificationCenter', () => ({
  NotificationCenter: () => (
    <div data-testid='notification-center'>Notifications</div>
  ),
}));

import { AppShell } from './AppShell.component';

describe('AppShell', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the navigation, the routed outlet and the notification center', () => {
    render(<AppShell />);

    expect(screen.getByTestId('app-navigation').textContent).toBe(
      'AppNavigation',
    );
    expect(screen.getByTestId('outlet').textContent).toBe('Outlet');
    expect(screen.getByTestId('notification-center').textContent).toBe(
      'Notifications',
    );
  });

  it('exposes routed content as the one main landmark', () => {
    render(<AppShell />);

    const main = screen.getByRole('main');

    expect(main.contains(screen.getByTestId('outlet'))).toBe(true);
    expect(document.querySelectorAll('main')).toHaveLength(1);
  });
});
