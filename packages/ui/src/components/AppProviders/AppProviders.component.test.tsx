// @vitest-environment jsdom

import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';
import type { ThemeMode } from '@lcabrera/ui/types/theme.types';
import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
}));

type MockGlobalSettingsProviderProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly initialSettings?: GlobalSettingsState;
};

type MockNotificationProviderProps = {
  readonly children: ReactNode;
};

type MockThemeProviderProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly initialTheme?: ThemeMode;
};

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock('@lcabrera/ui/contexts/ThemeContext', () => ({
  ThemeProvider: ({
    appId,
    children,
    defaultTheme,
    initialTheme,
  }: MockThemeProviderProps) => (
    <div
      data-app-id={appId ?? 'none'}
      data-default-theme={defaultTheme}
      data-initial-theme={initialTheme ?? 'none'}
      data-testid='theme-provider'
    >
      {children}
    </div>
  ),
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext', () => ({
  GlobalSettingsProvider: ({
    appId,
    children,
    initialSettings,
  }: MockGlobalSettingsProviderProps) => (
    <div
      data-app-id={appId ?? 'none'}
      data-initial-settings={JSON.stringify(initialSettings)}
      data-testid='global-settings-provider'
    >
      {children}
    </div>
  ),
}));

vi.mock('@lcabrera/ui/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: MockNotificationProviderProps) => (
    <div data-testid='notification-provider'>{children}</div>
  ),
}));

import { AppProviders } from './AppProviders.component';

const globalSettings: GlobalSettingsState = {
  navigation: {
    collapsed: 'expanded',
    size: 'medium',
  },
  pinning: {},
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLoaderDataMock.mockReset();
  useLoaderDataMock.mockReturnValue({ globalSettings, theme: 'dark' });
});

describe('AppProviders', () => {
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

  it('seeds the providers from the root loader rather than from props', () => {
    render(
      <AppProviders>
        <div />
      </AppProviders>,
    );

    expect(screen.getByTestId('theme-provider').dataset.initialTheme).toBe(
      'dark',
    );
    expect(
      screen.getByTestId('global-settings-provider').dataset.initialSettings,
    ).toBe(JSON.stringify(globalSettings));
  });

  it('forwards appId to both cookie-scoped providers and defaults the theme to light', () => {
    render(
      <AppProviders appId='showcase'>
        <div />
      </AppProviders>,
    );

    const themeProvider = screen.getByTestId('theme-provider');

    expect(themeProvider.dataset.defaultTheme).toBe('light');
    expect(themeProvider.dataset.appId).toBe('showcase');
    expect(screen.getByTestId('global-settings-provider').dataset.appId).toBe(
      'showcase',
    );
  });

  it('falls back to defaultTheme on a root route with no loader data', () => {
    useLoaderDataMock.mockReturnValue(undefined);

    render(
      <AppProviders defaultTheme='dark'>
        <div />
      </AppProviders>,
    );

    const themeProvider = screen.getByTestId('theme-provider');

    expect(themeProvider.dataset.defaultTheme).toBe('dark');
    expect(themeProvider.dataset.initialTheme).toBe('none');
    expect(
      screen.getByTestId('global-settings-provider').dataset.initialSettings,
    ).toBeUndefined();
  });
});
