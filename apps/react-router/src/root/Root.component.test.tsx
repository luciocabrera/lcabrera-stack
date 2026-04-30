// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ThemeMode } from '@/types/theme.types';

const { toggleThemeMock, useLoaderDataMock, useThemeMock } = vi.hoisted(() => ({
  toggleThemeMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

type MockThemeProviderProps = {
  readonly children: ReactNode;
  readonly initialTheme: ThemeMode;
};

type MockGlobalSettingsProviderProps = {
  readonly children: ReactNode;
};

type MockNotificationProviderProps = {
  readonly children: ReactNode;
};

type MockButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
};

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    Outlet: () => <div data-testid='outlet'>Outlet</div>,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock('@/components/Button', () => ({
  Button: ({ children, onClick }: MockButtonProps) => (
    <button onClick={onClick} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@/components/NotificationCenter', () => ({
  NotificationCenter: () => (
    <div data-testid='notification-center'>Notifications</div>
  ),
}));

vi.mock('@/components/Toolbar/Toolbar.examples', () => ({
  SidePanelToolbarExample: () => <div>Toolbar example</div>,
}));

vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children, initialTheme }: MockThemeProviderProps) => (
    <div data-initial-theme={initialTheme} data-testid='theme-provider'>
      {children}
    </div>
  ),
}));

vi.mock('@/contexts/GlobalSettingsContext', () => ({
  GlobalSettingsProvider: ({ children }: MockGlobalSettingsProviderProps) => (
    <div data-testid='global-settings-provider'>{children}</div>
  ),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: MockNotificationProviderProps) => (
    <div data-testid='notification-provider'>{children}</div>
  ),
}));

vi.mock('@/hooks/useTheme.hook', () => ({
  useTheme: useThemeMock,
}));

import { Root } from './Root.component';

describe('Root', () => {
  beforeEach(() => {
    useLoaderDataMock.mockReturnValue({
      globalSettings: { pinning: {} },
      theme: 'dark',
    });
    useThemeMock.mockReturnValue({
      isDarkMode: false,
      setTheme: vi.fn(),
      theme: 'light',
      toggleTheme: toggleThemeMock,
    });
    toggleThemeMock.mockReset();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ isHealthy: true, issues: [] }),
        ok: true,
      }),
    ) as unknown as typeof fetch;
  });

  it('wraps the app with ThemeProvider and wires the theme toggle button', () => {
    render(<Root />);

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('theme-provider').dataset.initialTheme).toBe(
      'dark',
    );
    expect(screen.getByTestId('global-settings-provider')).toBeDefined();
    expect(screen.getByTestId('notification-provider')).toBeDefined();
    expect(screen.getByTestId('notification-center').textContent).toBe(
      'Notifications',
    );
    expect(screen.getByTestId('outlet').textContent).toBe('Outlet');
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

  it('shows a dev warning banner when the db sanity endpoint reports issues', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            isHealthy: false,
            issues: ['Missing seed data'],
          }),
        ok: true,
      }),
    ) as unknown as typeof fetch;

    render(<Root />);

    await waitFor(() => {
      expect(
        screen.getByText(/Dev DB warning: Missing seed data/i).textContent,
      ).toContain('Missing seed data');
    });
  });

  it('shows a dev warning banner when the db sanity request fails', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error('DB sanity request failed')),
    ) as unknown as typeof fetch;

    render(<Root />);

    await waitFor(() => {
      expect(
        screen.getByText(/Dev DB warning: DB sanity request failed/i)
          .textContent,
      ).toContain('DB sanity request failed');
    });
  });
});
