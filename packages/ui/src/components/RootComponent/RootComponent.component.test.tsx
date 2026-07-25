// @vitest-environment jsdom

import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';
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

type MockAppConfigProviderProps = {
  readonly children: ReactNode;
  readonly getNavigationItems: (iconSize: number) => readonly unknown[];
  readonly isAuthEnabled?: boolean;
  readonly logoutRoute?: string;
};

type MockAppProvidersProps = {
  readonly appId?: string;
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly globalSettings?: GlobalSettingsState;
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

vi.mock('@lcabrera/ui/contexts/AppConfigContext', () => ({
  AppConfigProvider: ({
    children,
    getNavigationItems,
    isAuthEnabled,
    logoutRoute,
  }: MockAppConfigProviderProps) => (
    <div
      data-auth={String(isAuthEnabled)}
      data-items={String(getNavigationItems(24).length)}
      data-logout={logoutRoute ?? 'none'}
      data-testid='app-config'
    >
      {children}
    </div>
  ),
}));

vi.mock('@lcabrera/ui/components/AppProviders', () => ({
  AppProviders: ({
    appId,
    children,
    defaultTheme,
    globalSettings,
    initialTheme,
  }: MockAppProvidersProps) => (
    <div
      data-app-id={appId ?? 'none'}
      data-default-theme={defaultTheme}
      data-global-settings={JSON.stringify(globalSettings)}
      data-initial-theme={initialTheme ?? 'none'}
      data-testid='app-providers'
    >
      {children}
    </div>
  ),
}));

vi.mock('@lcabrera/ui/components/AppShell', () => ({
  AppShell: () => <div data-testid='app-shell'>AppShell</div>,
}));

import { RootComponent } from './RootComponent.component';

const getFixtureNavigationItems = (): readonly NavbarItemConfig[] => [
  { end: true, label: 'Home', to: '/', type: 'link' },
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useLoaderDataMock.mockReset();
  useLoaderDataMock.mockReturnValue({
    globalSettings: { navigation: {}, pinning: {} },
    theme: 'dark',
  });
});

describe('RootComponent', () => {
  it('feeds the root loader data into the app-wide providers', () => {
    render(
      <RootComponent
        appId='showcase'
        getNavigationItems={getFixtureNavigationItems}
      />,
    );

    const appProviders = screen.getByTestId('app-providers');

    expect(appProviders.dataset.appId).toBe('showcase');
    expect(appProviders.dataset.initialTheme).toBe('dark');
    expect(appProviders.dataset.globalSettings).toBe(
      JSON.stringify({ navigation: {}, pinning: {} }),
    );
  });

  it('renders the shell inside both providers', () => {
    render(<RootComponent getNavigationItems={getFixtureNavigationItems} />);

    const appConfig = screen.getByTestId('app-config');
    const appProviders = screen.getByTestId('app-providers');

    expect(appConfig.contains(appProviders)).toBe(true);
    expect(appProviders.contains(screen.getByTestId('app-shell'))).toBe(true);
  });

  it('publishes the app navigation items and defaults to a session-less app', () => {
    render(<RootComponent getNavigationItems={getFixtureNavigationItems} />);

    const appConfig = screen.getByTestId('app-config');

    expect(appConfig.dataset.items).toBe('1');
    expect(appConfig.dataset.auth).toBe('false');
    expect(appConfig.dataset.logout).toBe('none');
  });

  it('forwards the session configuration when the app declares one', () => {
    render(
      <RootComponent
        getNavigationItems={getFixtureNavigationItems}
        isAuthEnabled
        logoutRoute='/auth/sign-out'
      />,
    );

    const appConfig = screen.getByTestId('app-config');

    expect(appConfig.dataset.auth).toBe('true');
    expect(appConfig.dataset.logout).toBe('/auth/sign-out');
  });

  it('defaults the theme to light and survives a root route with no loader data', () => {
    useLoaderDataMock.mockReturnValue(undefined);

    render(<RootComponent getNavigationItems={getFixtureNavigationItems} />);

    const appProviders = screen.getByTestId('app-providers');

    expect(appProviders.dataset.defaultTheme).toBe('light');
    expect(appProviders.dataset.initialTheme).toBe('none');
  });
});
