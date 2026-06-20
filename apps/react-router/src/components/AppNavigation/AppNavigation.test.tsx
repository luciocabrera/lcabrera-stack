// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { mockDialogElement } from '@/utils/tests/mockDialogElement.util';

import { AppNavigation } from './AppNavigation.component';

type RenderWithGlobalSettingsArgs = {
  readonly initialSettings: GlobalSettingsState;
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};

const renderWithGlobalSettings = ({
  initialSettings,
  isDarkMode,
  onToggleTheme,
}: RenderWithGlobalSettingsArgs) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <GlobalSettingsProvider initialSettings={initialSettings}>
            <AppNavigation
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
            />
          </GlobalSettingsProvider>
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

const restoreMockDialogRef: { current: () => void } = {
  current: () => {
    // no-op default restore before setup
  },
};

afterEach(() => {
  restoreMockDialogRef.current();
  cleanup();
});

beforeEach(() => {
  restoreMockDialogRef.current = mockDialogElement().restore;
});

describe('AppNavigation', () => {
  it('renders the configured route links and theme toggle', () => {
    const handleToggleTheme = vi.fn();

    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
      isDarkMode: false,
      onToggleTheme: handleToggleTheme,
    });

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Enterprise Orders/i }),
    ).toBeDefined();
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows the launcher after unpinning the sidebar', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
      isDarkMode: true,
      onToggleTheme: vi.fn(),
    });

    fireEvent.click(screen.getByRole('button', { name: /Unpin navigation/i }));

    expect(
      screen.getByRole('button', { name: /Open navigation/i }),
    ).toBeDefined();
  });

  it('uses compact density from global settings preference', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'compact',
        },
        pinning: {},
      },
      isDarkMode: false,
      onToggleTheme: vi.fn(),
    });

    expect(
      screen.getByRole('button', { name: /Unpin navigation/i }),
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
      isDarkMode: false,
      onToggleTheme: vi.fn(),
    });

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();
  });

  it('starts unpinned with the panel open when global pinned preference is unpinned', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
      isDarkMode: false,
      onToggleTheme: vi.fn(),
    });

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('starts unpinned and collapsed when both global preferences are selected', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          collapsed: 'collapsed',
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
      isDarkMode: false,
      onToggleTheme: vi.fn(),
    });

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Expand navigation/i)).toBeDefined();
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('collapses and expands the navigation panel independently of pinning', () => {
    renderWithGlobalSettings({
      initialSettings: { navigation: { size: 'medium' }, pinning: {} },
      isDarkMode: false,
      onToggleTheme: vi.fn(),
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
