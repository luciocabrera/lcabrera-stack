// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ColumnSettingsDrawer } from './ColumnSettingsDrawer.component';

type MockButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
};

type MockSidePanelHeaderProps = {
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

type MockSidePanelHeaderToolbarProps = {
  readonly onClose?: () => void;
  readonly onTogglePin?: () => void;
};

type MockSidePanelProps = {
  readonly children: ReactNode;
  readonly onClose?: () => void;
};

type MockTabsProps = {
  readonly tabs: readonly { readonly header: string }[];
};

type MockTitleProps = {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
};

const {
  batchSetColumnDrawerSettingsMock,
  resetAllColumnDrawerSettingsMock,
  setTableColumnSettingsSelectedTabMock,
  setTableIsColumnSettingsPinnedMock,
  useGetNormalizedColumnMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useTableWrapperRefMock,
} = vi.hoisted(() => ({
  batchSetColumnDrawerSettingsMock: vi.fn(),
  resetAllColumnDrawerSettingsMock: vi.fn(),
  setTableColumnSettingsSelectedTabMock: vi.fn(),
  setTableIsColumnSettingsPinnedMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(() => false),
  useGetTableIsLoadingMoreMock: vi.fn(() => false),
  useTableWrapperRefMock: vi.fn(),
}));

const MockButton = vi.hoisted(() => {
  return function MockButton({ children, onClick }: MockButtonProps) {
    return (
      <button onClick={onClick} type='button'>
        {children}
      </button>
    );
  };
});

const MockDetailsSection = vi.hoisted(() => {
  return function MockDetailsSection() {
    return <div>Details</div>;
  };
});

const MockFilterSection = vi.hoisted(() => {
  return function MockFilterSection() {
    return <div>Filter</div>;
  };
});

const MockGeneralSection = vi.hoisted(() => {
  return function MockGeneralSection() {
    return <div>General</div>;
  };
});

const MockPinningSection = vi.hoisted(() => {
  return function MockPinningSection() {
    return <div>Pinning</div>;
  };
});

const MockSettingsIcon = vi.hoisted(() => {
  return function MockSettingsIcon() {
    return <span>settings-icon</span>;
  };
});

const MockSidePanel = vi.hoisted(() => {
  return function MockSidePanel({ children, onClose }: MockSidePanelProps) {
    return (
      <div data-testid='side-panel'>
        <button onClick={onClose} type='button'>
          SidePanel Close
        </button>
        {children}
      </div>
    );
  };
});

const MockSidePanelBody = vi.hoisted(() => {
  return function MockSidePanelBody({ children }: MockSidePanelProps) {
    return <div>{children}</div>;
  };
});

const MockSidePanelFooter = vi.hoisted(() => {
  return function MockSidePanelFooter({ children }: MockSidePanelProps) {
    return <div>{children}</div>;
  };
});

const MockSidePanelHeader = vi.hoisted(() => {
  return function MockSidePanelHeader({
    actions,
    children,
  }: MockSidePanelHeaderProps) {
    return (
      <div>
        {actions}
        {children}
      </div>
    );
  };
});

const MockSidePanelHeaderToolbar = vi.hoisted(() => {
  return function MockSidePanelHeaderToolbar({
    onClose,
    onTogglePin,
  }: MockSidePanelHeaderToolbarProps) {
    return (
      <div>
        <button onClick={onTogglePin} type='button'>
          Toggle pin
        </button>
        <button onClick={onClose} type='button'>
          Close
        </button>
      </div>
    );
  };
});

const MockSidePanelTitle = vi.hoisted(() => {
  return function MockSidePanelTitle({ children, icon }: MockTitleProps) {
    return (
      <h2>
        {icon}
        {children}
      </h2>
    );
  };
});

const MockSortingSection = vi.hoisted(() => {
  return function MockSortingSection() {
    return <div>Sorting</div>;
  };
});

const MockTabs = vi.hoisted(() => {
  return function MockTabs({ tabs }: MockTabsProps) {
    return (
      <div data-testid='tabs'>{tabs.map((tab) => tab.header).join('|')}</div>
    );
  };
});

const MockUseBatchSetColumnDrawerSettings = vi.hoisted(() => {
  return function MockUseBatchSetColumnDrawerSettings() {
    return batchSetColumnDrawerSettingsMock;
  };
});

const MockUseResetAllColumnDrawerSettings = vi.hoisted(() => {
  return function MockUseResetAllColumnDrawerSettings() {
    return resetAllColumnDrawerSettingsMock;
  };
});

vi.mock('@lcabrera/ui/components/Button', () => ({
  Button: MockButton,
}));

vi.mock('@lcabrera/ui/components/Icons', () => ({
  SettingsIcon: MockSettingsIcon,
}));

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanel: MockSidePanel,
  SidePanelBody: MockSidePanelBody,
  SidePanelFooter: MockSidePanelFooter,
  SidePanelHeader: MockSidePanelHeader,
  SidePanelHeaderToolbar: MockSidePanelHeaderToolbar,
  SidePanelTitle: MockSidePanelTitle,
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumn: useGetNormalizedColumnMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions',
  () => ({
    useSetTableColumnSettingsSelectedTab: () =>
      setTableColumnSettingsSelectedTabMock,
    useSetTableIsColumnSettingsPinned: () => setTableIsColumnSettingsPinnedMock,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableColumnSelectedKey: () => 'customer',
    useGetTableColumnSettingsSelectedTab: () => 'general',
    useGetTableIsColumnSettingsPinned: () => false,
  }),
);

vi.mock('@lcabrera/ui/components/Table/contexts/TableWrapper', () => ({
  useTableWrapperRef: useTableWrapperRefMock,
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableData/data/selectors',
  () => ({
    useGetTableIsLoading: () => useGetTableIsLoadingMock(),
    useGetTableIsLoadingMore: () => useGetTableIsLoadingMoreMock(),
  }),
);

vi.mock('@lcabrera/ui/components/Tabs', () => ({
  Tabs: MockTabs,
}));

vi.mock('./ColumnDrawerContext/actions', () => ({
  useBatchSetColumnDrawerSettings: MockUseBatchSetColumnDrawerSettings,
  useResetAllColumnDrawerSettings: MockUseResetAllColumnDrawerSettings,
}));

vi.mock('./DetailsSection', () => ({
  DetailsSection: MockDetailsSection,
}));

vi.mock('./FilterSection', () => ({
  FilterSection: MockFilterSection,
}));

vi.mock('./GeneralSection', () => ({
  GeneralSection: MockGeneralSection,
}));

vi.mock('./PinningSection', () => ({
  PinningSection: MockPinningSection,
}));

vi.mock('./SortingSection', () => ({
  SortingSection: MockSortingSection,
}));

afterEach(() => {
  batchSetColumnDrawerSettingsMock.mockReset();
  resetAllColumnDrawerSettingsMock.mockReset();
  setTableColumnSettingsSelectedTabMock.mockReset();
  setTableIsColumnSettingsPinnedMock.mockReset();
  useGetTableIsLoadingMock.mockReset();
  useGetTableIsLoadingMock.mockReturnValue(false);
  useGetTableIsLoadingMoreMock.mockReset();
  useGetTableIsLoadingMoreMock.mockReturnValue(false);
  useGetNormalizedColumnMock.mockReset();
  useTableWrapperRefMock.mockReset();
  cleanup();
});

describe('ColumnSettingsDrawer', () => {
  it('includes all conditional tabs for filterable, sortable, non-static columns', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: 'number',
      isFilterable: true,
      isSortable: true,
      isStatic: false,
      label: 'Revenue',
    });

    render(<ColumnSettingsDrawer />);

    expect(screen.getByTestId('tabs').textContent).toBe(
      'General|Filter|Sorting|Pinning|Details',
    );
    expect(
      screen.getByRole('heading', { name: /Revenue/i }).textContent,
    ).toContain('Revenue');
  });

  it('omits filter, sorting, and pinning tabs when column settings disallow them', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: undefined,
      isFilterable: false,
      isSortable: false,
      isStatic: true,
      label: 'Status',
    });

    render(<ColumnSettingsDrawer />);

    expect(screen.getByTestId('tabs').textContent).toBe('General|Details');
  });

  it('calls batch and reset actions from footer buttons', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: 'string',
      isFilterable: true,
      isSortable: true,
      isStatic: false,
      label: 'Customer',
    });

    render(<ColumnSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(batchSetColumnDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });

  it('wires header toolbar interactions to drawer handlers', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: 'string',
      isFilterable: true,
      isSortable: true,
      isStatic: false,
      label: 'Customer',
    });

    render(<ColumnSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(setTableIsColumnSettingsPinnedMock).toHaveBeenCalledWith(true);
    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });

  it('does not run actions when drawer is busy', () => {
    useGetTableIsLoadingMock.mockReturnValue(true);
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: 'string',
      isFilterable: true,
      isSortable: true,
      isStatic: false,
      label: 'Customer',
    });

    render(<ColumnSettingsDrawer />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle pin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'SidePanel Close' }));

    expect(batchSetColumnDrawerSettingsMock).not.toHaveBeenCalled();
    expect(resetAllColumnDrawerSettingsMock).not.toHaveBeenCalled();
    expect(setTableIsColumnSettingsPinnedMock).not.toHaveBeenCalled();
  });
});
