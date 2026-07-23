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

const { collapsedPreferenceMock, sizePreferenceMock } = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
}));

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isIconOnly?: boolean;
  readonly onClick?: () => void;
  readonly tooltipContent?: string;
};

vi.mock('@lcabrera/ui/components/Button', () => ({
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

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
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

  it('renders the session-actions slot with the expanded collapsed state', () => {
    const sessionActions = vi.fn(
      ({ isCollapsed }: { readonly isCollapsed: boolean }) => (
        <span data-testid='session'>{String(isCollapsed)}</span>
      ),
    );

    render(
      <NavigationFooter
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        sessionActions={sessionActions}
      />,
    );

    expect(sessionActions).toHaveBeenCalledWith({ isCollapsed: false });
    expect(screen.getByTestId('session').textContent).toBe('false');
  });

  it('passes isCollapsed=true to the session-actions slot when collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');
    const sessionActions = vi.fn(() => <span data-testid='session'>x</span>);

    render(
      <NavigationFooter
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        sessionActions={sessionActions}
      />,
    );

    expect(sessionActions).toHaveBeenCalledWith({ isCollapsed: true });
  });
});
