// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toggleThemeMock, useThemeMock } = vi.hoisted(() => ({
  toggleThemeMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

type MockAppNavigationProps = {
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    Outlet: () => <div data-testid='outlet'>Outlet</div>,
  };
});

vi.mock('@repo/ui/components/AppNavigation', () => ({
  AppNavigation: ({ isDarkMode, onToggleTheme }: MockAppNavigationProps) => (
    <button onClick={onToggleTheme} type='button'>
      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  ),
}));

vi.mock('@repo/ui/components/NotificationCenter', () => ({
  NotificationCenter: () => (
    <div data-testid='notification-center'>Notifications</div>
  ),
}));

vi.mock('@repo/ui/hooks/useTheme.hook', () => ({
  useTheme: useThemeMock,
}));

import { AppShell } from './AppShell.component';

describe('AppShell', () => {
  beforeEach(() => {
    useThemeMock.mockReturnValue({
      isDarkMode: false,
      setTheme: vi.fn(),
      theme: 'light',
      toggleTheme: toggleThemeMock,
    });
    toggleThemeMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the routed outlet and notification center', () => {
    render(<AppShell />);

    expect(screen.getByTestId('outlet').textContent).toBe('Outlet');
    expect(screen.getByTestId('notification-center').textContent).toBe(
      'Notifications',
    );
  });

  it('wires the theme toggle button to useTheme', () => {
    render(<AppShell />);

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });
});
