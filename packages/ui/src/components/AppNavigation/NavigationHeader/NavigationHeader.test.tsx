// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collapsedPreferenceMock,
  setGlobalNavigationPreferencesMock,
  sizePreferenceMock,
} = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => undefined),
  setGlobalNavigationPreferencesMock: vi.fn(),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => undefined),
}));

type MockHeaderActionsProps = {
  readonly isCollapsed: boolean;
  readonly isExpanded: boolean;
  readonly isPinned: boolean;
  readonly onClose: () => void;
  readonly onToggleExpanded: () => void;
  readonly onTogglePinned: () => void;
};

vi.mock('@repo/ui/components/Icons', () => ({
  MenuIcon: () => <span>Menu icon</span>,
}));

vi.mock('@repo/ui/contexts/GlobalSettingsContext/actions', () => ({
  useSetGlobalNavigationPreferences: () => setGlobalNavigationPreferencesMock,
}));

vi.mock('@repo/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

vi.mock('../NavigationHeaderActions', () => ({
  NavigationHeaderActions: ({
    isCollapsed,
    isExpanded,
    isPinned,
    onClose,
    onToggleExpanded,
    onTogglePinned,
  }: MockHeaderActionsProps) => (
    <div
      data-collapsed={String(isCollapsed)}
      data-expanded={String(isExpanded)}
      data-pinned={String(isPinned)}
      data-testid='header-actions'
    >
      <button onClick={onToggleExpanded} type='button'>
        Toggle expanded
      </button>
      <button onClick={onTogglePinned} type='button'>
        Toggle pinned
      </button>
      <button onClick={onClose} type='button'>
        Close
      </button>
    </div>
  ),
}));

import { NavigationHeader } from './NavigationHeader.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  setGlobalNavigationPreferencesMock.mockReset();
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
});

describe('NavigationHeader', () => {
  it('renders the brand and the header actions', () => {
    render(<NavigationHeader isPinned onClose={vi.fn()} />);

    expect(screen.getByText('Navigation')).not.toBeNull();
    expect(screen.getByTestId('header-actions').dataset.expanded).toBe('true');
  });

  it('collapses the navigation through the global preference action', () => {
    render(<NavigationHeader isPinned onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle expanded' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      collapsed: 'collapsed',
    });
  });

  it('expands a collapsed navigation through the global preference action', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationHeader isPinned onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle expanded' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      collapsed: 'expanded',
    });
  });

  it('unpins a pinned navigation through the global preference action', () => {
    render(<NavigationHeader isPinned onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pinned' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      pinned: 'unpinned',
    });
  });

  it('pins an unpinned navigation through the global preference action', () => {
    render(<NavigationHeader isPinned={false} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pinned' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      pinned: 'pinned',
    });
  });

  it('delegates closing to the parent handler', () => {
    const handleClose = vi.fn();

    render(<NavigationHeader isPinned={false} onClose={handleClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('marks the actions collapsed when the collapsed preference is set', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationHeader isPinned onClose={vi.fn()} />);

    expect(screen.getByTestId('header-actions').dataset.collapsed).toBe('true');
  });
});
