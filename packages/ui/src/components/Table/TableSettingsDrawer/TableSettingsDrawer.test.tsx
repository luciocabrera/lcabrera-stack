// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  batchSetTableDrawerSettingsMock,
  isTableSettingsPinnedMock,
  notifyMock,
  resetTableDrawerSettingsMock,
  selectedTabMock,
  setSelectedTabMock,
  setTableIsTableSettingsOpenMock,
  setTableIsTableSettingsPinnedMock,
  tableColumnFiltersMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
} = vi.hoisted(() => ({
  batchSetTableDrawerSettingsMock: vi.fn(),
  isTableSettingsPinnedMock: vi.fn(() => false),
  notifyMock: vi.fn(),
  resetTableDrawerSettingsMock: vi.fn(),
  selectedTabMock: vi.fn(() => 'general'),
  setSelectedTabMock: vi.fn(),
  setTableIsTableSettingsOpenMock: vi.fn(),
  setTableIsTableSettingsPinnedMock: vi.fn(),
  tableColumnFiltersMock: {} as Record<string, unknown>,
  useGetTableIsLoadingMock: vi.fn(() => false),
  useGetTableIsLoadingMoreMock: vi.fn(() => false),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  batchSetTableDrawerSettingsMock.mockReset();
  isTableSettingsPinnedMock.mockReset();
  isTableSettingsPinnedMock.mockReturnValue(false);
  notifyMock.mockReset();
  selectedTabMock.mockReset();
  selectedTabMock.mockReturnValue('general');
  setSelectedTabMock.mockReset();
  for (const key of Object.keys(tableColumnFiltersMock)) {
    delete tableColumnFiltersMock[key];
  }
  resetTableDrawerSettingsMock.mockReset();
  setTableIsTableSettingsOpenMock.mockReset();
  setTableIsTableSettingsPinnedMock.mockReset();
  useGetTableIsLoadingMock.mockReset();
  useGetTableIsLoadingMock.mockReturnValue(false);
  useGetTableIsLoadingMoreMock.mockReset();
  useGetTableIsLoadingMoreMock.mockReturnValue(false);
});

type ButtonProps = {
  readonly children: ReactNode;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
  readonly title?: string;
};

type MockSidePanelHeaderProps = {
  readonly actions: ReactNode;
  readonly children: ReactNode;
};

type MockSidePanelHeaderToolbarProps = {
  readonly isPinned: boolean;
  readonly onClose: () => void;
  readonly onTogglePin: () => void;
};

type MockSidePanelProps = {
  readonly children: ReactNode;
  readonly isPinned: boolean;
  readonly onClose: () => void;
};

type MockTabsProps = {
  readonly onSelectTab?: (tabKey: string) => void;
  readonly selectedTab?: string;
  readonly tabs: readonly {
    readonly children: ReactNode;
    readonly header: string;
    readonly key: string;
  }[];
};

vi.mock('@repo/ui/components/Button', () => ({
  Button: ({ children, isDisabled, onClick, title }: ButtonProps) => (
    <button disabled={isDisabled} onClick={onClick} title={title} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@repo/ui/components/Icons', () => ({
  SettingsIcon: () => <span>Settings icon</span>,
}));

vi.mock('@repo/ui/components/NotificationCenter', () => ({
  NotificationCenter: () => <div>Notification center</div>,
}));

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanel: ({ children, isPinned, onClose }: MockSidePanelProps) => (
    <div data-pinned={String(isPinned)} data-testid='side-panel'>
      <button onClick={onClose} type='button'>
        Panel close
      </button>
      {children}
    </div>
  ),
  SidePanelBody: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
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
  SidePanelTitle: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@repo/ui/components/Tabs', () => ({
  Tabs: ({ onSelectTab, selectedTab, tabs }: MockTabsProps) => (
    <div data-selected-tab={selectedTab}>
      <button
        onClick={() => {
          onSelectTab?.('sorting');
        }}
        type='button'
      >
        Select sorting tab
      </button>
      {tabs.map((tab) => (
        <section key={tab.key}>
          <h2>{tab.header}</h2>
          {tab.children}
        </section>
      ))}
    </div>
  ),
}));

vi.mock('../contexts/TableConfig/meta/actions', () => ({
  useSetTableIsTableSettingsOpen: () => setTableIsTableSettingsOpenMock,
  useSetTableIsTableSettingsPinned: () => setTableIsTableSettingsPinnedMock,
  useSetTableSettingsSelectedTab: () => setSelectedTabMock,
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsTableSettingsPinned: () => isTableSettingsPinnedMock(),
  useGetTableSettingsSelectedTab: () => selectedTabMock(),
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: () => useGetTableIsLoadingMock(),
  useGetTableIsLoadingMore: () => useGetTableIsLoadingMoreMock(),
}));

vi.mock('./ColumnOrderSection', () => ({
  ColumnOrderSection: () => <div>Column order section</div>,
}));

vi.mock('./DetailsSection', () => ({
  DetailsSection: () => <div>Details section</div>,
}));

vi.mock(
  './ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider',
  () => ({
    ColumnOrderSectionProvider: ({
      children,
    }: {
      readonly children: ReactNode;
    }) => <div>{children}</div>,
  }),
);

vi.mock('./FiltersSection', () => ({
  FiltersSection: () => <div>Filters section</div>,
}));

vi.mock('./GeneralSettingsSection', () => ({
  GeneralSettingsSection: () => <div>General settings section</div>,
}));

vi.mock('./SortingSection', () => ({
  SortingSection: () => <div>Sorting section</div>,
}));

vi.mock('./TableDrawerContext/actions', () => ({
  useBatchSetTableDrawerSettings: () => batchSetTableDrawerSettingsMock,
  useResetTableSettings: () => resetTableDrawerSettingsMock,
}));

vi.mock('./TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => tableColumnFiltersMock,
}));

vi.mock('@repo/ui/contexts/NotificationContext/actions', () => ({
  useNotifyAction: () => notifyMock,
}));

import { TableSettingsDrawer } from './TableSettingsDrawer.component';

describe('TableSettingsDrawer', () => {
  it('renders the expected section tabs', () => {
    render(<TableSettingsDrawer />);

    expect(screen.getByText('Details').textContent).toBe('Details');
    expect(screen.getByText('General').textContent).toBe('General');
    expect(screen.getByText('Filters').textContent).toBe('Filters');
    expect(screen.getByRole('heading', { name: 'Sorting' }).textContent).toBe(
      'Sorting',
    );
    expect(screen.getByText('Columns').textContent).toBe('Columns');
  });

  it('accepts changes and closes the drawer when unpinned', () => {
    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('accepts changes and keeps the drawer open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('cancels changes, resets drawer state, and closes when unpinned', () => {
    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).toHaveBeenCalledWith(false);
  });

  it('cancels changes, resets drawer state, and keeps open when pinned', () => {
    isTableSettingsPinnedMock.mockReturnValue(true);

    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });

  it('toggles pin state through meta action', () => {
    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));

    expect(setTableIsTableSettingsPinnedMock).toHaveBeenCalledWith(true);
  });

  it('restores and persists selected table settings tab', () => {
    selectedTabMock.mockReturnValue('sorting');

    render(<TableSettingsDrawer />);

    expect(
      screen.getByText('Select sorting tab').parentElement?.dataset.selectedTab,
    ).toBe('sorting');

    fireEvent.click(screen.getByRole('button', { name: 'Select sorting tab' }));

    expect(setSelectedTabMock).toHaveBeenCalledWith('sorting');
  });

  it('shows a notification and blocks accept when filters are invalid', () => {
    tableColumnFiltersMock.order_date = {
      operator: 'equals',
      type: 'date',
      value: '',
    };

    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(setTableIsTableSettingsOpenMock).not.toHaveBeenCalled();
  });
});
