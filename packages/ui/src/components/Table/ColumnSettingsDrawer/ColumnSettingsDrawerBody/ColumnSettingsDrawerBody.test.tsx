// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { selectedTabMock, setSelectedTabMock, useGetNormalizedColumnMock } =
  vi.hoisted(() => ({
    selectedTabMock: vi.fn(() => 'general'),
    setSelectedTabMock: vi.fn(),
    useGetNormalizedColumnMock: vi.fn(),
  }));

type MockTabsProps = {
  readonly isBusy?: boolean;
  readonly onSelectTab?: (tabKey: string) => void;
  readonly selectedTab?: string;
  readonly tabs: readonly { readonly header: string }[];
};

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelBody: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumn: useGetNormalizedColumnMock,
  }),
);

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableColumnSettingsSelectedTab: () => setSelectedTabMock,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableColumnSettingsSelectedTab: () => selectedTabMock(),
  }),
);

vi.mock('@repo/ui/components/Tabs', () => ({
  Tabs: ({ isBusy, onSelectTab, selectedTab, tabs }: MockTabsProps) => (
    <div
      data-busy={String(isBusy)}
      data-selected-tab={selectedTab}
      data-testid='tabs'
    >
      <button
        onClick={() => {
          onSelectTab?.('sorting');
        }}
        type='button'
      >
        Select sorting tab
      </button>
      {tabs.map((tab) => tab.header).join('|')}
    </div>
  ),
}));

vi.mock('../DetailsSection', () => ({
  DetailsSection: () => <div>Details section</div>,
}));

vi.mock('../FilterSection', () => ({
  FilterSection: () => <div>Filter section</div>,
}));

vi.mock('../GeneralSection', () => ({
  GeneralSection: () => <div>General section</div>,
}));

vi.mock('../PinningSection', () => ({
  PinningSection: () => <div>Pinning section</div>,
}));

vi.mock('../SortingSection', () => ({
  SortingSection: () => <div>Sorting section</div>,
}));

import { ColumnSettingsDrawerBody } from './ColumnSettingsDrawerBody.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  selectedTabMock.mockReset();
  selectedTabMock.mockReturnValue('general');
  setSelectedTabMock.mockReset();
  useGetNormalizedColumnMock.mockReset();
  useGetNormalizedColumnMock.mockReturnValue({
    dataType: 'number',
    isFilterable: true,
    isSortable: true,
    isStatic: false,
    label: 'Revenue',
  });
});

describe('ColumnSettingsDrawerBody', () => {
  it('includes all conditional tabs for filterable, sortable, non-static columns', () => {
    render(<ColumnSettingsDrawerBody columnKey='revenue' />);

    expect(screen.getByTestId('tabs').textContent).toContain(
      'General|Filter|Sorting|Pinning|Details',
    );
  });

  it('omits filter, sorting, and pinning tabs when column settings disallow them', () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: undefined,
      isFilterable: false,
      isSortable: false,
      isStatic: true,
      label: 'Status',
    });

    render(<ColumnSettingsDrawerBody columnKey='status' />);

    expect(screen.getByTestId('tabs').textContent).toContain('General|Details');
    expect(screen.getByTestId('tabs').textContent).not.toContain('Filter');
  });

  it('restores and persists the selected column settings tab', () => {
    selectedTabMock.mockReturnValue('sorting');

    render(<ColumnSettingsDrawerBody columnKey='revenue' />);

    expect(screen.getByTestId('tabs').dataset.selectedTab).toBe('sorting');

    fireEvent.click(screen.getByRole('button', { name: 'Select sorting tab' }));

    expect(setSelectedTabMock).toHaveBeenCalledWith('sorting');
  });

  it('forwards the busy flag to the tabs', () => {
    render(<ColumnSettingsDrawerBody columnKey='revenue' isBusy />);

    expect(screen.getByTestId('tabs').dataset.busy).toBe('true');
  });
});
