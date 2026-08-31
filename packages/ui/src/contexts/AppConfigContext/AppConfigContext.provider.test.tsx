// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { NavbarItemConfig } from '#ui/components/Navbar/Navbar.types';

import { AppConfigProvider } from './AppConfigContext.provider';
import { useGetAppLogoutRoute } from './selectors/useGetAppLogoutRoute.hook';
import { useGetAppNavigationItems } from './selectors/useGetAppNavigationItems.hook';
import { useGetIsAuthEnabled } from './selectors/useGetIsAuthEnabled.hook';

const getFixtureNavigationItems = (
  iconSize: number,
): readonly NavbarItemConfig[] => [
  { end: true, label: `Home ${iconSize}`, to: '/', type: 'link' },
];

const ConfigProbe = () => {
  const getNavigationItems = useGetAppNavigationItems();
  const isAuthEnabled = useGetIsAuthEnabled();
  const logoutRoute = useGetAppLogoutRoute();

  return (
    <div>
      <output data-testid='items'>
        {getNavigationItems(24)
          .map((item) => item.label)
          .join('|')}
      </output>
      <output data-testid='auth'>{String(isAuthEnabled)}</output>
      <output data-testid='logout'>{logoutRoute}</output>
    </div>
  );
};

afterEach(() => {
  cleanup();
});

describe('AppConfigProvider', () => {
  it('publishes the app-supplied navigation items to its descendants', () => {
    render(
      <AppConfigProvider getNavigationItems={getFixtureNavigationItems}>
        <ConfigProbe />
      </AppConfigProvider>,
    );

    expect(screen.getByTestId('items').textContent).toBe('Home 24');
  });

  it('treats an app as session-less and defaults the logout route', () => {
    render(
      <AppConfigProvider getNavigationItems={getFixtureNavigationItems}>
        <ConfigProbe />
      </AppConfigProvider>,
    );

    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('logout').textContent).toBe('/logout');
  });

  it('carries the app overrides when they are supplied', () => {
    render(
      <AppConfigProvider
        getNavigationItems={getFixtureNavigationItems}
        isAuthEnabled
        logoutRoute='/auth/sign-out'
      >
        <ConfigProbe />
      </AppConfigProvider>,
    );

    expect(screen.getByTestId('auth').textContent).toBe('true');
    expect(screen.getByTestId('logout').textContent).toBe('/auth/sign-out');
  });
});
