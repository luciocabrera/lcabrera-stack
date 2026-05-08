// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';

import { AppNavigation } from './AppNavigation.component';

import type { GlobalSettingsState } from '@/types/globalSettings.types';

// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedClose = HTMLDialogElement.prototype.close;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShow = HTMLDialogElement.prototype.show;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShowModal = HTMLDialogElement.prototype.showModal;
let closeMock: ReturnType<typeof vi.fn>;
let showMock: ReturnType<typeof vi.fn>;
let showModalMock: ReturnType<typeof vi.fn>;

afterEach(() => {
  HTMLDialogElement.prototype.close = savedClose;
  HTMLDialogElement.prototype.show = savedShow;
  HTMLDialogElement.prototype.showModal = savedShowModal;
  cleanup();
});

beforeEach(() => {
  closeMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: false,
      writable: true,
    });
  });
  showMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: true,
      writable: true,
    });
  });
  showModalMock = vi.fn(function (this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: true,
      writable: true,
    });
  });
  HTMLDialogElement.prototype.close = closeMock as HTMLDialogElement['close'];
  HTMLDialogElement.prototype.show = showMock as HTMLDialogElement['show'];
  HTMLDialogElement.prototype.showModal =
    showModalMock as HTMLDialogElement['showModal'];
});

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
