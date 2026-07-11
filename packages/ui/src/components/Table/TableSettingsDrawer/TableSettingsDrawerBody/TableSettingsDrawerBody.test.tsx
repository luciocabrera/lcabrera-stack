// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { selectedTabMock, setSelectedTabMock } = vi.hoisted(() => ({
  selectedTabMock: vi.fn(() => 'general'),
  setSelectedTabMock: vi.fn(),
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

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelBody: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@repo/ui/components/Tabs', () => ({
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

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsSelectedTab: () => setSelectedTabMock,
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableSettingsSelectedTab: () => selectedTabMock(),
  }),
);

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

vi.mock('../SortingSection', () => ({
  SortingSection: () => <div>Sorting section</div>,
}));

import { TableSettingsDrawerBody } from './TableSettingsDrawerBody.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
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
