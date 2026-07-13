// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  isColumnSettingsPinnedMock,
  resetAllColumnDrawerSettingsMock,
  setIsColumnSettingsPinnedMock,
  useGetNormalizedColumnMock,
} = vi.hoisted(() => ({
  isColumnSettingsPinnedMock: vi.fn(() => false),
  resetAllColumnDrawerSettingsMock: vi.fn(),
  setIsColumnSettingsPinnedMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
}));

type MockSidePanelHeaderProps = {
  readonly actions: ReactNode;
  readonly children: ReactNode;
};

type MockSidePanelHeaderToolbarProps = {
  readonly isPinned: boolean;
  readonly onClose: () => void;
  readonly onTogglePin: () => void;
};

vi.mock('@repo/ui/components/Icons', () => ({
  SettingsIcon: () => <span>Settings icon</span>,
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelHeader: ({ actions, children }: MockSidePanelHeaderProps) => (
    <div>
      {children}
      {actions}
    </div>
  ),
  SidePanelHeaderToolbar: ({
    isPinned,
    onClose,
    onTogglePin,
  }: MockSidePanelHeaderToolbarProps) => (
    <div data-pinned={String(isPinned)} data-testid='header-toolbar'>
      <button onClick={onTogglePin} type='button'>
        Toggle pin
      </button>
      <button onClick={onClose} type='button'>
        Toolbar close
      </button>
    </div>
  ),
  SidePanelTitle: ({
    children,
    icon,
  }: {
    readonly children: ReactNode;
    readonly icon: ReactNode;
  }) => (
    <h2>
      {icon}
      {children}
    </h2>
  ),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumn: useGetNormalizedColumnMock,
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableIsColumnSettingsPinned: () => setIsColumnSettingsPinnedMock,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsColumnSettingsPinned: () => isColumnSettingsPinnedMock(),
  }),
);

vi.mock('../ColumnDrawerContext/actions', () => ({
  useResetAllColumnDrawerSettings: () => resetAllColumnDrawerSettingsMock,
}));

import { ColumnSettingsDrawerHeader } from './ColumnSettingsDrawerHeader.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  isColumnSettingsPinnedMock.mockReset();
  isColumnSettingsPinnedMock.mockReturnValue(false);
  resetAllColumnDrawerSettingsMock.mockReset();
  setIsColumnSettingsPinnedMock.mockReset();
  useGetNormalizedColumnMock.mockReset();
  useGetNormalizedColumnMock.mockReturnValue({ label: 'Revenue' });
});

describe('ColumnSettingsDrawerHeader', () => {
  it('renders the column label as the drawer title', () => {
    render(<ColumnSettingsDrawerHeader />);

    expect(
      screen.getByRole('heading', { name: /Revenue/i }).textContent,
    ).toContain('Revenue');
    expect(screen.getByText('Settings icon')).not.toBeNull();
  });

  it('pins the drawer through the meta action when unpinned', () => {
    render(<ColumnSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));

    expect(setIsColumnSettingsPinnedMock).toHaveBeenCalledWith(true);
  });

  it('unpins the drawer through the meta action when pinned', () => {
    isColumnSettingsPinnedMock.mockReturnValue(true);

    render(<ColumnSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));

    expect(setIsColumnSettingsPinnedMock).toHaveBeenCalledWith(false);
  });

  it('cancels drawer changes and requests close when unpinned on toolbar close', () => {
    render(<ColumnSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });

  it('cancels drawer changes without closing when pinned on toolbar close', () => {
    isColumnSettingsPinnedMock.mockReturnValue(true);

    render(<ColumnSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(false);
  });

  it('ignores pin toggling and closing while busy', () => {
    render(<ColumnSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(setIsColumnSettingsPinnedMock).not.toHaveBeenCalled();
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
  });
});
