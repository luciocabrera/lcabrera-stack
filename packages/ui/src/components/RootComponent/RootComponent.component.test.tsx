// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { NavbarItemConfig } from '#ui/components/Navbar/Navbar.types';
import type { ThemeMode } from '#ui/types/theme.types';

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
};

vi.mock('#ui/contexts/AppConfigContext', () => ({
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

vi.mock('#ui/components/AppProviders', () => ({
  AppProviders: ({ appId, children, defaultTheme }: MockAppProvidersProps) => (
    <div
      data-app-id={appId ?? 'none'}
      data-default-theme={defaultTheme}
      data-testid='app-providers'
    >
      {children}
    </div>
  ),
}));

vi.mock('#ui/components/AppShell', () => ({
  AppShell: () => <div data-testid='app-shell'>AppShell</div>,
}));

import { RootComponent } from './RootComponent.component';

const getFixtureNavigationItems = (): readonly NavbarItemConfig[] => [
  { end: true, label: 'Home', to: '/', type: 'link' },
];

afterEach(() => {
  cleanup();
});

describe('RootComponent', () => {
  it('forwards the app id and default theme to the app-wide providers', () => {
    render(
      <RootComponent
        appId='showcase'
        defaultTheme='dark'
        getNavigationItems={getFixtureNavigationItems}
      />,
    );

    const appProviders = screen.getByTestId('app-providers');

    expect(appProviders.dataset.appId).toBe('showcase');
    expect(appProviders.dataset.defaultTheme).toBe('dark');
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

  it('defaults the theme to light', () => {
    render(<RootComponent getNavigationItems={getFixtureNavigationItems} />);

    expect(screen.getByTestId('app-providers').dataset.defaultTheme).toBe(
      'light',
    );
  });
});
