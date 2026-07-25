// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { collapsedPreferenceMock, sizePreferenceMock, useThemeMock } =
  vi.hoisted(() => ({
    collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
    sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
    useThemeMock: vi.fn(),
  }));

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isIconOnly?: boolean;
  readonly onClick?: () => void;
  readonly size?: string;
  readonly tooltipContent?: string;
};

vi.mock('@lcabrera/ui/components/Button', () => ({
  Button: ({
    children,
    isIconOnly,
    onClick,
    size,
    tooltipContent,
  }: MockButtonProps) => (
    <button
      data-icon-only={String(isIconOnly)}
      data-size={size}
      data-tooltip={tooltipContent ?? 'none'}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  ),
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

vi.mock('@lcabrera/ui/hooks/useTheme.hook', () => ({
  useTheme: () => useThemeMock(),
}));

import { NavigationThemeControl } from './NavigationThemeControl.component';

const toggleThemeMock = vi.fn();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
  toggleThemeMock.mockReset();
  useThemeMock.mockReset();
  useThemeMock.mockReturnValue({
    isDarkMode: false,
    setTheme: vi.fn(),
    theme: 'light',
    toggleTheme: toggleThemeMock,
  });
});

describe('NavigationThemeControl', () => {
  it('offers Dark Mode in light theme and toggles on click', () => {
    render(<NavigationThemeControl />);

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/ }));

    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

  it('offers Light Mode in dark theme', () => {
    useThemeMock.mockReturnValue({
      isDarkMode: true,
      setTheme: vi.fn(),
      theme: 'dark',
      toggleTheme: toggleThemeMock,
    });

    render(<NavigationThemeControl />);

    expect(screen.getByRole('button', { name: /Light Mode/ })).not.toBeNull();
  });

  it('shows a labelled button with no tooltip when expanded', () => {
    render(<NavigationThemeControl />);

    const button = screen.getByRole('button', { name: /Dark Mode/ });

    expect(button.dataset.iconOnly).toBe('false');
    expect(button.dataset.tooltip).toBe('none');
  });

  it('collapses to an icon-only button with a tooltip when collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationThemeControl />);

    const button = screen.getByRole('button', { name: /Dark Mode/ });

    expect(button.dataset.iconOnly).toBe('true');
    expect(button.dataset.tooltip).toBe('Dark Mode');
  });

  it('sizes the button from the density preference', () => {
    sizePreferenceMock.mockReturnValue('compact');

    render(<NavigationThemeControl />);

    expect(screen.getByRole('button', { name: /Dark Mode/ }).dataset.size).toBe(
      'mini',
    );
  });
});
