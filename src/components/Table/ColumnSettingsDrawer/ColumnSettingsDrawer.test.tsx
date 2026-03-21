// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColumnSettingsDrawer } from './ColumnSettingsDrawer.component';

type MockButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
};

type MockSidePanelHeaderProps = {
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

type MockSidePanelProps = {
  readonly children: ReactNode;
};

type MockTabsProps = {
  readonly tabs: readonly { readonly header: string }[];
};

type MockTitleProps = {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
};

const batchSetColumnDrawerSettingsMock = vi.fn();
const resetAllColumnDrawerSettingsMock = vi.fn();
const useGetNormalizedColumnMock = vi.fn();
const useRenderTrackerMock = vi.fn();
const getBatchSetColumnDrawerSettingsMock = () =>
  batchSetColumnDrawerSettingsMock;
const getResetAllColumnDrawerSettingsMock = () =>
  resetAllColumnDrawerSettingsMock;
const getTableWrapperRefMock = vi.fn();

const MockSettingsIcon = () => <span>settings-icon</span>;

const MockButton = ({ children, onClick }: MockButtonProps) => (
  <button onClick={onClick} type='button'>
    {children}
  </button>
);

const MockSidePanel = ({ children }: MockSidePanelProps) => (
  <div data-testid='side-panel'>{children}</div>
);

const MockSidePanelHeader = ({
  actions,
  children,
}: MockSidePanelHeaderProps) => (
  <div>
    {actions}
    {children}
  </div>
);

const MockSidePanelTitle = ({ children, icon }: MockTitleProps) => (
  <h2>
    {icon}
    {children}
  </h2>
);

const MockTabs = ({ tabs }: MockTabsProps) => (
  <div data-testid='tabs'>{tabs.map((tab) => tab.header).join('|')}</div>
);

const MockSidePanelBody = ({ children }: MockSidePanelProps) => (
  <div>{children}</div>
);

const MockSidePanelFooter = ({ children }: MockSidePanelProps) => (
  <div>{children}</div>
);

const MockSidePanelHeaderToolbar = () => <div>toolbar</div>;

const MockDetailsSection = () => <div>Details</div>;
const MockFilterSection = () => <div>Filter</div>;
const MockGeneralSection = () => <div>General</div>;
const MockPinningSection = () => <div>Pinning</div>;
const MockSortingSection = () => <div>Sorting</div>;

vi.mock('@/components/Button', () => ({
  Button: MockButton,
}));

vi.mock('@/components/Icons', () => ({
  SettingsIcon: MockSettingsIcon,
}));

vi.mock('@/components/SidePanel', () => ({
  SidePanel: MockSidePanel,
  SidePanelBody: MockSidePanelBody,
  SidePanelFooter: MockSidePanelFooter,
  SidePanelHeader: MockSidePanelHeader,
  SidePanelHeaderToolbar: MockSidePanelHeaderToolbar,
  SidePanelTitle: MockSidePanelTitle,
}));

vi.mock('@/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: useGetNormalizedColumnMock,
}));

vi.mock('@/components/Table/contexts/TableWrapper', () => ({
  useTableWrapperRef: getTableWrapperRefMock,
}));

vi.mock('@/components/Tabs', () => ({
  Tabs: MockTabs,
}));

vi.mock('@/utils/performance', () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock('./ColumnDrawerContext/actions', () => ({
  useBatchSetColumnDrawerSettings: getBatchSetColumnDrawerSettingsMock,
  useResetAllColumnDrawerSettings: getResetAllColumnDrawerSettingsMock,
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

describe('ColumnSettingsDrawer', () => {
  it('includes all conditional tabs for filterable, sortable, non-static columns', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: 'number',
      isFilterable: true,
      isSortable: true,
      isStatic: false,
      label: 'Revenue',
    });

    render(<ColumnSettingsDrawer columnKey='revenue' />);

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

    render(<ColumnSettingsDrawer columnKey='status' />);

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

    render(<ColumnSettingsDrawer columnKey='customer' />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(batchSetColumnDrawerSettingsMock).toHaveBeenCalledTimes(1);
    expect(resetAllColumnDrawerSettingsMock).toHaveBeenCalledWith(true);
  });
});
