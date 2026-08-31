// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { NavbarItemConfig } from '#ui/components/Navbar/Navbar.types';
import type { GlobalSettingsState } from '#ui/types/globalSettings.types';

import { AppConfigProvider } from '#ui/contexts/AppConfigContext';
import { GlobalSettingsProvider } from '#ui/contexts/GlobalSettingsContext';

import { AppNavigation } from './AppNavigation.component';

const { toggleThemeMock, useThemeMock } = vi.hoisted(() => ({
  toggleThemeMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

vi.mock('#ui/hooks/useTheme.hook', () => ({
  useTheme: () => useThemeMock(),
}));

const getFixtureNavigationItems = (): readonly NavbarItemConfig[] => [
  { end: true, label: 'Home', to: '/', type: 'link' },
  { label: 'Enterprise Orders', to: '/enterprise-orders', type: 'link' },
];

type RenderWithGlobalSettingsArgs = {
  readonly initialSettings: GlobalSettingsState;
};

const renderWithGlobalSettings = ({
  initialSettings,
}: RenderWithGlobalSettingsArgs) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <AppConfigProvider getNavigationItems={getFixtureNavigationItems}>
            <GlobalSettingsProvider initialSettings={initialSettings}>
              <AppNavigation />
            </GlobalSettingsProvider>
          </AppConfigProvider>
        ),
        path: '/',
      },
      {
        action: async () => {
          return;
        },
        path: '/_action/persist-cookie',
      },
    ],
    {
      initialEntries: ['/'],
    },
  );

  return render(<RouterProvider router={router} />);
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  toggleThemeMock.mockReset();
  useThemeMock.mockReset();
  useThemeMock.mockReturnValue({
    isDarkMode: false,
    setTheme: vi.fn(),
    theme: 'light',
    toggleTheme: toggleThemeMock,
  });
});

describe('AppNavigation', () => {
  it('renders the configured route links and theme toggle', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Enterprise Orders/i }),
    ).toBeDefined();
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

  it('renders as a permanent aside with no dismiss control', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
    });

    expect(screen.getByTestId('side-panel').tagName).toBe('ASIDE');
    expect(
      screen.queryByRole('button', { name: /Close navigation/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /pin navigation/i }),
    ).toBeNull();
  });

  it('uses compact density from global settings preference', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'compact',
        },
        pinning: {},
      },
    });

    expect(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Dark Mode/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
  });

  it('starts collapsed when global collapsed preference is selected', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          collapsed: 'collapsed',
          size: 'medium',
        },
        pinning: {},
      },
    });

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();
  });

  it('collapses and expands the navigation panel', () => {
    renderWithGlobalSettings({
      initialSettings: { navigation: { size: 'medium' }, pinning: {} },
    });

    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    );

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Expand navigation/i }));

    expect(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    ).toBeDefined();
  });
});
