// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';

import { AppNavigation } from './AppNavigation.component';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

afterEach(cleanup);

describe('AppNavigation', () => {
  const renderWithGlobalSettings = (
    initialSettings: GlobalSettingsState,
    onToggleTheme: () => void,
    isDarkMode: boolean,
  ) => {
    return render(
      <GlobalSettingsProvider initialSettings={initialSettings}>
        <MemoryRouter>
          <AppNavigation
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
          />
        </MemoryRouter>
      </GlobalSettingsProvider>,
    );
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
