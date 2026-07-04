// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';
import type { ThemeMode } from '@repo/ui/types/theme.types';

type MockThemeProviderProps = {
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly initialTheme?: ThemeMode;
};

type MockGlobalSettingsProviderProps = {
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};

type MockNotificationProviderProps = {
  readonly children: ReactNode;
};

vi.mock('@repo/ui/contexts/ThemeContext', () => ({
  ThemeProvider: ({
    children,
    defaultTheme,
    initialTheme,
  }: MockThemeProviderProps) => (
    <div
      data-default-theme={defaultTheme}
      data-initial-theme={initialTheme}
      data-testid='theme-provider'
    >
      {children}
    </div>
  ),
}));

vi.mock('@repo/ui/contexts/GlobalSettingsContext', () => ({
  GlobalSettingsProvider: ({
    children,
    initialSettings,
  }: MockGlobalSettingsProviderProps) => (
    <div
      data-initial-settings={JSON.stringify(initialSettings)}
      data-testid='global-settings-provider'
    >
      {children}
    </div>
  ),
}));

vi.mock('@repo/ui/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: MockNotificationProviderProps) => (
    <div data-testid='notification-provider'>{children}</div>
  ),
}));

import { AppProviders } from './AppProviders.component';

describe('AppProviders', () => {
  afterEach(() => {
    cleanup();
  });

  it('nests ThemeProvider > GlobalSettingsProvider > NotificationProvider > children', () => {
    render(
      <AppProviders>
        <div data-testid='child'>Child</div>
      </AppProviders>,
    );

    const themeProvider = screen.getByTestId('theme-provider');
    const globalSettingsProvider = screen.getByTestId(
      'global-settings-provider',
    );
    const notificationProvider = screen.getByTestId('notification-provider');

    expect(themeProvider.contains(globalSettingsProvider)).toBe(true);
    expect(globalSettingsProvider.contains(notificationProvider)).toBe(true);
    expect(screen.getByTestId('child').textContent).toBe('Child');
  });

  it('defaults defaultTheme to light when not provided', () => {
    render(
      <AppProviders>
        <div />
      </AppProviders>,
    );

    expect(screen.getByTestId('theme-provider').dataset.defaultTheme).toBe(
      'light',
    );
  });

  it('forwards defaultTheme, initialTheme, and globalSettings to their providers', () => {
    const globalSettings: GlobalSettingsState = {
      navigation: {
        collapsed: 'expanded',
        pinned: 'pinned',
        size: 'medium',
      },
      pinning: {},
    };

    render(
      <AppProviders
        defaultTheme='dark'
        globalSettings={globalSettings}
        initialTheme='light'
      >
        <div />
      </AppProviders>,
    );

    const themeProvider = screen.getByTestId('theme-provider');
    expect(themeProvider.dataset.defaultTheme).toBe('dark');
    expect(themeProvider.dataset.initialTheme).toBe('light');
    expect(
      screen.getByTestId('global-settings-provider').dataset.initialSettings,
    ).toBe(JSON.stringify(globalSettings));
  });
});
