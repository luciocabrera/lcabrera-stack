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

const {
  hasAdvancedSettingsRef,
  isGroupingEnabledRef,
  selectedTabMock,
  setSelectedTabMock,
  tabOrderRef,
} = vi.hoisted(() => ({
  hasAdvancedSettingsRef: { current: false },
  isGroupingEnabledRef: { current: false },
  selectedTabMock: vi.fn(() => 'general'),
  setSelectedTabMock: vi.fn(),
  tabOrderRef: { current: undefined as readonly string[] | undefined },
}));

type MockTabsProps = {
  readonly isBusy?: boolean;
  readonly onSelectTab?: (tabKey: string) => void;
  readonly selectedTab?: string;
  readonly tabs: readonly {
    readonly children: ReactNode;
    readonly header: string;
    readonly key: string;
  }[];
};

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelBody: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('#ui/components/Tabs', () => ({
  Tabs: ({ isBusy, onSelectTab, selectedTab, tabs }: MockTabsProps) => (
    <div data-busy={String(isBusy)} data-selected-tab={selectedTab}>
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

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsSelectedTab: () => setSelectedTabMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
  useGetTableSettingsSelectedTab: () => selectedTabMock(),
  useGetTableSettingsTabOrder: () => tabOrderRef.current,
}));

vi.mock('../AdvancedSettingsSection', () => ({
  AdvancedSettingsSection: () => <div>Advanced settings section</div>,
  useHasAdvancedSettings: () => hasAdvancedSettingsRef.current,
}));

vi.mock('../ColumnOrderSection', () => ({
  ColumnOrderSection: () => <div>Column order section</div>,
}));

vi.mock(
  '../ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider',
  () => ({
    ColumnOrderSectionProvider: ({
      children,
    }: {
      readonly children: ReactNode;
    }) => <div>{children}</div>,
  }),
);

vi.mock('../DetailsSection', () => ({
  DetailsSection: () => <div>Details section</div>,
}));

vi.mock('../FiltersSection', () => ({
  FiltersSection: () => <div>Filters section</div>,
}));

vi.mock('../GeneralSettingsSection', () => ({
  GeneralSettingsSection: () => <div>General settings section</div>,
}));

vi.mock('../GroupingSection', () => ({
  GroupingSection: () => <div>Grouping section</div>,
}));

vi.mock('../SortingSection', () => ({
  SortingSection: () => <div>Sorting section</div>,
}));

import { TableSettingsDrawerBody } from './TableSettingsDrawerBody.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  hasAdvancedSettingsRef.current = false;
  isGroupingEnabledRef.current = false;
  tabOrderRef.current = undefined;
  selectedTabMock.mockReset();
  selectedTabMock.mockReturnValue('general');
  setSelectedTabMock.mockReset();
});

describe('TableSettingsDrawerBody', () => {
  it('renders the expected section tabs', () => {
    render(<TableSettingsDrawerBody />);

    expect(screen.getByText('General').textContent).toBe('General');
    expect(screen.getByText('Filters').textContent).toBe('Filters');
    expect(screen.getByRole('heading', { name: 'Sorting' }).textContent).toBe(
      'Sorting',
    );
    expect(screen.getByText('Columns').textContent).toBe('Columns');
    expect(screen.getByText('Details').textContent).toBe('Details');
  });

  it('offers no Advanced tab for a route that cannot group', () => {
    render(<TableSettingsDrawerBody />);

    expect(screen.queryByText('Advanced')).toBeNull();
    expect(screen.queryByText('Advanced settings section')).toBeNull();
  });

  it('offers no Grouping tab for a route that cannot group', () => {
    render(<TableSettingsDrawerBody />);

    expect(screen.queryByText('Grouping')).toBeNull();
    expect(screen.queryByText('Grouping section')).toBeNull();
  });

  it('adds the Grouping tab where the route declared the capability', () => {
    isGroupingEnabledRef.current = true;
    hasAdvancedSettingsRef.current = true;

    render(<TableSettingsDrawerBody />);

    expect(screen.getByRole('heading', { name: 'Grouping' }).textContent).toBe(
      'Grouping',
    );
    expect(screen.getByText('Grouping section')).not.toBeNull();
  });

  it('puts Columns after General and Grouping after Sorting', () => {
    isGroupingEnabledRef.current = true;
    hasAdvancedSettingsRef.current = true;

    render(<TableSettingsDrawerBody />);

    const headers = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent);

    expect(headers).toEqual([
      'General',
      'Columns',
      'Filters',
      'Sorting',
      'Grouping',
      'Details',
      'Advanced',
    ]);
  });

  it('paints the tabs in the order the reader arranged them', () => {
    isGroupingEnabledRef.current = true;
    hasAdvancedSettingsRef.current = true;
    tabOrderRef.current = ['details', 'grouping', 'general'];

    render(<TableSettingsDrawerBody />);

    const headers = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent);

    expect(headers).toEqual([
      'Details',
      'Grouping',
      'General',
      'Columns',
      'Filters',
      'Sorting',
      'Advanced',
    ]);
  });

  it('ignores a stored order naming a tab the drawer does not have', () => {
    tabOrderRef.current = ['sorting', 'nonsense'];

    render(<TableSettingsDrawerBody />);

    const headers = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent);

    expect(headers).toEqual([
      'Sorting',
      'General',
      'Columns',
      'Filters',
      'Details',
    ]);
  });

  it('restores and persists the selected table settings tab', () => {
    selectedTabMock.mockReturnValue('sorting');

    render(<TableSettingsDrawerBody />);

    expect(
      screen.getByText('Select sorting tab').parentElement?.dataset.selectedTab,
    ).toBe('sorting');

    fireEvent.click(screen.getByRole('button', { name: 'Select sorting tab' }));

    expect(setSelectedTabMock).toHaveBeenCalledWith('sorting');
  });

  it('forwards the busy flag to the tabs', () => {
    render(<TableSettingsDrawerBody isBusy />);

    expect(
      screen.getByText('Select sorting tab').parentElement?.dataset.busy,
    ).toBe('true');
  });
});
