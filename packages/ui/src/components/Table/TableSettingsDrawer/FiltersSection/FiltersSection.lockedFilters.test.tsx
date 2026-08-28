// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  TableColumn,
  TableLockedFilters,
} from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { NotificationProvider } from '#ui/contexts/NotificationContext';

import { FiltersSection } from './FiltersSection.component';

type Row = {
  readonly id: number;
  readonly region: string;
  readonly status: string;
};

afterEach(cleanup);

const columns: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'status', label: 'Status' },
  { dataType: 'string', key: 'region', label: 'Region' },
];

const LOCKED: TableLockedFilters = {
  entries: [
    { columnKey: 'region', label: 'Region', value: 'North' },
    { columnKey: 'tier', label: 'Tier', value: 'Gold' },
  ],
};

const READER_FILTER = {
  status: { operator: 'equals', type: 'text', value: 'Open' },
} as ColumnFiltersState<Row>;

const Harness = () => (
  <NotificationProvider>
    <TableConfigProvider<Row>
      columnsState={{ columnFilters: READER_FILTER, columns }}
      metaState={{ lockedFilters: LOCKED }}
    >
      <TableDrawerProvider>
        <FiltersSection />
      </TableDrawerProvider>
    </TableConfigProvider>
  </NotificationProvider>
);

const renderPanel = () => {
  render(
    <RouterProvider
      router={createMemoryRouter([{ element: <Harness />, path: '/' }])}
    />,
  );
};

/** Rendered twice by design: the section header's variant and the footer's. */
const clickInHeaderToolbar = (name: string) => {
  fireEvent.click(screen.getAllByRole('button', { name })[0] as HTMLElement);
};

const lockedEntryKeys = () =>
  [...screen.getByTestId('locked-filters-list').querySelectorAll('li')].map(
    (entry) => entry.dataset.testid,
  );

describe('FiltersSection with locked filters', () => {
  it('lists the restriction beside the reader’s own filters, counted apart', () => {
    renderPanel();

    expect(screen.getByTestId('locked-filters-list').textContent).toContain(
      'Locked Filters (2)',
    );
    expect(screen.getByTestId('filter-item-status')).not.toBeNull();
    expect(document.body.textContent).toContain('Active Filters (1)');
  });

  it('leaves the restriction standing when Clear Filters runs', () => {
    renderPanel();

    clickInHeaderToolbar('Clear Filters');

    expect(screen.queryByTestId('filter-item-status')).toBeNull();
    expect(document.body.textContent).toContain('Active Filters (0)');
    expect(lockedEntryKeys()).toEqual([
      'locked-filter-region',
      'locked-filter-tier',
    ]);
  });

  it('leaves the restriction standing when Reset Filters runs', () => {
    renderPanel();

    clickInHeaderToolbar('Clear Filters');
    clickInHeaderToolbar('Reset Filters');

    expect(screen.getByTestId('filter-item-status')).not.toBeNull();
    expect(lockedEntryKeys()).toEqual([
      'locked-filter-region',
      'locked-filter-tier',
    ]);
  });
});
