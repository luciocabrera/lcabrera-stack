// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  batchSetTableDrawerSettingsMock,
  notifyMock,
  tableColumnFiltersMock,
  resetTableDrawerSettingsMock,
  toogleTableIsTableSettingsOpenMock,
} = vi.hoisted(() => ({
  batchSetTableDrawerSettingsMock: vi.fn(),
  notifyMock: vi.fn(),
  tableColumnFiltersMock: {} as Record<string, unknown>,
  resetTableDrawerSettingsMock: vi.fn(),
  toogleTableIsTableSettingsOpenMock: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  batchSetTableDrawerSettingsMock.mockReset();
  notifyMock.mockReset();
  Object.keys(tableColumnFiltersMock).forEach((key) => {
    delete tableColumnFiltersMock[key];
  });
  resetTableDrawerSettingsMock.mockReset();
  toogleTableIsTableSettingsOpenMock.mockReset();
});

type ButtonProps = {
  readonly children: ReactNode;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
  readonly title?: string;
};

type MockSidePanelProps = {
  readonly children: ReactNode;
  readonly isPinned: boolean;
  readonly onClose: () => void;
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

type MockTabsProps = {
  readonly tabs: readonly {
    readonly children: ReactNode;
    readonly header: string;
    readonly key: string;
  }[];
};

vi.mock('@/components/Button', () => ({
  Button: ({ children, isDisabled, onClick, title }: ButtonProps) => (
    <button disabled={isDisabled} onClick={onClick} title={title} type='button'>
      {children}
    </button>
  ),
}));

vi.mock('@/components/Icons', () => ({
  SettingsIcon: () => <span>Settings icon</span>,
}));

vi.mock('@/components/NotificationCenter', () => ({
  NotificationCenter: () => <div>Notification center</div>,
}));

vi.mock('@/components/SidePanel', () => ({
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

vi.mock('@/components/Tabs', () => ({
  Tabs: ({ tabs }: MockTabsProps) => (
    <div>
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
  useToogleTableIsTableSettingsOpen: () => toogleTableIsTableSettingsOpenMock,
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

vi.mock('@/hooks/useNotifications.hook', () => ({
  useNotifications: () => ({
    notify: notifyMock,
  }),
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

  it('accepts changes and clears the pinned state', () => {
    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    expect(screen.getByTestId('side-panel').dataset.pinned).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(batchSetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('side-panel').dataset.pinned).toBe('false');
  });

  it('cancels changes, resets drawer state, and closes the drawer', () => {
    render(<TableSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(resetTableDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(toogleTableIsTableSettingsOpenMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('side-panel').dataset.pinned).toBe('false');
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
  });
});
