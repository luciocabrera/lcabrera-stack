// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  isTableSettingsPinnedMock,
  resetTableDrawerSettingsMock,
  setTableIsTableSettingsOpenMock,
  setTableIsTableSettingsPinnedMock,
} = vi.hoisted(() => ({
  isTableSettingsPinnedMock: vi.fn(() => false),
  resetTableDrawerSettingsMock: vi.fn(),
  setTableIsTableSettingsOpenMock: vi.fn(),
  setTableIsTableSettingsPinnedMock: vi.fn(),
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

vi.mock('@lcabrera/ui/components/Icons', () => ({
  SettingsIcon: () => <span>Settings icon</span>,
}));

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
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
    <div>
      {icon}
      {children}
    </div>
  ),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions',
  () => ({
    useSetTableIsTableSettingsOpen: () => setTableIsTableSettingsOpenMock,
    useSetTableIsTableSettingsPinned: () => setTableIsTableSettingsPinnedMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableIsTableSettingsPinned: () => isTableSettingsPinnedMock(),
  }),
);

vi.mock('../TableDrawerContext/actions', () => ({
  useResetTableSettings: () => resetTableDrawerSettingsMock,
}));

import { TableSettingsDrawerHeader } from './TableSettingsDrawerHeader.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  isTableSettingsPinnedMock.mockReset();
  isTableSettingsPinnedMock.mockReturnValue(false);
  resetTableDrawerSettingsMock.mockReset();
  setTableIsTableSettingsOpenMock.mockReset();
  setTableIsTableSettingsPinnedMock.mockReset();
});

describe('TableSettingsDrawerHeader', () => {
  it('renders the drawer title with the settings icon', () => {
    render(<TableSettingsDrawerHeader />);

    expect(screen.getByText('Table Settings')).not.toBeNull();
    expect(screen.getByText('Settings icon')).not.toBeNull();
  });

  it('pins the drawer through the meta action when unpinned', () => {
    render(<TableSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));

    expect(setTableIsTableSettingsPinnedMock).toHaveBeenCalledWith(true);
  });

  it('unpins the drawer through the meta action when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));

    expect(setTableIsTableSettingsPinnedMock).toHaveBeenCalledWith(false);
  });

  it('cancels drawer changes and closes when unpinned on toolbar close', () => {
    render(<TableSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('cancels drawer changes and keeps open when pinned on toolbar close', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawerHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('ignores pin toggling and closing while busy', () => {
    render(<TableSettingsDrawerHeader isBusy />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toolbar close' }));

    expect(setTableIsTableSettingsPinnedMock).not.toHaveBeenCalled();
    expect(resetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });
});
