// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { collapsedPreferenceMock, sizePreferenceMock } = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => undefined),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => undefined),
}));

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isIconOnly?: boolean;
  readonly onClick?: () => void;
  readonly tooltipContent?: string;
};

vi.mock('@repo/ui/components/Button', () => ({
  Button: ({
    children,
    isIconOnly,
    onClick,
    tooltipContent,
  }: MockButtonProps) => (
    <button
      data-icon-only={String(isIconOnly)}
      data-tooltip={tooltipContent ?? 'none'}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  ),
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@repo/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

import { NavigationFooter } from './NavigationFooter.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
});

describe('NavigationFooter', () => {
  it('offers Dark Mode in light theme and toggles on click', () => {
    const handleToggleTheme = vi.fn();

    render(
      <NavigationFooter isDarkMode={false} onToggleTheme={handleToggleTheme} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/ }));

    expect(handleToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('offers Light Mode in dark theme', () => {
    render(<NavigationFooter isDarkMode onToggleTheme={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Light Mode/ })).not.toBeNull();
  });

  it('shows a full-width labelled button when expanded', () => {
    render(<NavigationFooter isDarkMode={false} onToggleTheme={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Dark Mode/ });

    expect(button.dataset.iconOnly).toBe('false');
    expect(button.dataset.tooltip).toBe('none');
  });

  it('collapses to an icon-only button with a tooltip when collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationFooter isDarkMode={false} onToggleTheme={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Dark Mode/ });

    expect(button.dataset.iconOnly).toBe('true');
    expect(button.dataset.tooltip).toBe('Dark Mode');
  });
});
