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

/**
 * The filters panel of a table whose read is already scoped by something it cannot change
 * — a drill into one group (ADR-087).
 *
 * These mount the real panel rather than a mock of it, because the property under test is
 * about two surfaces that do not know about each other: the reader's own filters live in
 * the drawer's draft store, the restriction lives on the table's meta, and "clearing one
 * leaves the other standing" is only true while that stays so.
 */
type Row = {
  readonly customer_type: string;
  readonly order_id: number;
  readonly order_status: string;
};

afterEach(cleanup);

const columns: TableColumn<Row>[] = [
  {
    dataType: 'number',
    isPrimaryKey: true,
    key: 'order_id',
    label: 'Order ID',
  },
  { dataType: 'string', key: 'order_status', label: 'Status' },
  { dataType: 'string', key: 'customer_type', label: 'Customer Type' },
];

const LOCKED: TableLockedFilters = {
  entries: [
    { columnKey: 'category', label: 'Category', value: 'Automotive' },
    { columnKey: 'customer_type', label: 'Customer Type', value: 'Business' },
  ],
};

// `ColumnFiltersState` is a total record over the row's keys; a real store never
// holds an entry per column, so the cast is what every caller of it does.
const READER_FILTER = {
  order_status: { operator: 'equals', type: 'text', value: 'Shipped' },
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

/**
 * Both toolbars carry these buttons by design — the section header's compact
 * variant and the labelled footer one — and either must behave the same.
 */
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
    expect(screen.getByTestId('filter-item-order_status')).not.toBeNull();
    expect(document.body.textContent).toContain('Active Filters (1)');
  });

  it('leaves the restriction standing when Clear Filters runs', () => {
    renderPanel();

    clickInHeaderToolbar('Clear Filters');

    expect(screen.queryByTestId('filter-item-order_status')).toBeNull();
    expect(document.body.textContent).toContain('Active Filters (0)');
    expect(lockedEntryKeys()).toEqual([
      'locked-filter-category',
      'locked-filter-customer_type',
    ]);
  });

  it('leaves the restriction standing when Reset Filters runs', () => {
    renderPanel();

    clickInHeaderToolbar('Clear Filters');
    clickInHeaderToolbar('Reset Filters');

    // Reset re-seeds the draft from the table, so the reader's filter is back —
    // and the restriction never moved either way.
    expect(screen.getByTestId('filter-item-order_status')).not.toBeNull();
    expect(lockedEntryKeys()).toEqual([
      'locked-filter-category',
      'locked-filter-customer_type',
    ]);
  });
});
