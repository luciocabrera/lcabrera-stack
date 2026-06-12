// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDialogElement } from '@/components/test-utils/mockDialogElement.util';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';

import { AppNavigation } from './AppNavigation.component';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

let restoreMockDialog: () => void;

afterEach(() => {
  restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  restoreMockDialog = mockDialogElement().restore;
});

describe('AppNavigation', () => {
  const renderWithGlobalSettings = (
    initialSettings: GlobalSettingsState,
    onToggleTheme: () => void,
    isDarkMode: boolean,
  ) => {
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
            return null;
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

  it('renders the configured route links and theme toggle', () => {
    const handleToggleTheme = vi.fn();

    renderWithGlobalSettings(
      {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
      handleToggleTheme,
      false,
    );

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Enterprise Orders/i }),
    ).toBeDefined();
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows the launcher after unpinning the sidebar', () => {
    renderWithGlobalSettings(
      {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
      vi.fn(),
      true,
    );

    fireEvent.click(screen.getByRole('button', { name: /Unpin navigation/i }));

    expect(
      screen.getByRole('button', { name: /Open navigation/i }),
    ).toBeDefined();
  });

  it('uses compact density from global settings preference', () => {
    renderWithGlobalSettings(
      {
        navigation: {
          size: 'compact',
        },
        pinning: {},
      },
      vi.fn(),
      false,
    );

    expect(
      screen.getByRole('button', { name: /Unpin navigation/i }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Dark Mode/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
  });

  it('starts collapsed when global collapsed preference is selected', () => {
    renderWithGlobalSettings(
      {
        navigation: {
          collapsed: 'collapsed',
          size: 'medium',
        },
        pinning: {},
      },
      vi.fn(),
      false,
    );

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();
  });

  it('starts unpinned with the panel open when global pinned preference is unpinned', () => {
    renderWithGlobalSettings(
      {
        navigation: {
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
      vi.fn(),
      false,
    );

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('starts unpinned and collapsed when both global preferences are selected', () => {
    renderWithGlobalSettings(
      {
        navigation: {
          collapsed: 'collapsed',
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
      vi.fn(),
      false,
    );

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Expand navigation/i)).toBeDefined();
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('collapses and expands the navigation panel independently of pinning', () => {
    renderWithGlobalSettings(
      { navigation: { size: 'medium' }, pinning: {} },
      vi.fn(),
      false,
    );

    // Initially expanded — nav links are visible
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();

    // Collapse the panel
    fireEvent.click(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    );

    // Expand button label changes
    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();

    // Expand again
    fireEvent.click(screen.getByRole('button', { name: /Expand navigation/i }));

    expect(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    ).toBeDefined();
  });
});
