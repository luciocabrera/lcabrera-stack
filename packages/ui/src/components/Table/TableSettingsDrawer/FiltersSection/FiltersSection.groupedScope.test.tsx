// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

type MockVirtualSelectOption =
  | string
  | { readonly label: string; readonly value: string };

type MockVirtualSelectProps = {
  readonly onChange: (values: string[]) => void;
  readonly options: readonly MockVirtualSelectOption[];
  readonly placeholder: string;
};

const toOptionPair = (option: MockVirtualSelectOption) =>
  typeof option === 'string' ? { label: option, value: option } : option;

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({
    onChange,
    options,
    placeholder,
  }: MockVirtualSelectProps) => (
    <ul data-testid={placeholder}>
      {options.map((option) => {
        const { label, value } = toOptionPair(option);

        return (
          <li key={value}>
            <button
              onClick={() => {
                onChange([value]);
              }}
              type='button'
            >
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  ),
}));

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { NotificationProvider } from '#ui/contexts/NotificationContext';

import { FiltersSection } from './FiltersSection.component';

type Row = {
  readonly amount: number;
  readonly id: number;
  readonly region: string;
  readonly status: string;
};

const columns: TableColumn<Row>[] = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'region', label: 'Region' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
  { dataType: 'string', key: 'status', label: 'Status' },
];

const GROUPING_KEYS = ['region'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'amount', fn: 'sum' },
];

const STATUS_FILTER = {
  status: { operator: 'equals', type: 'text', value: 'Open' },
} as ColumnFiltersState<Row>;

type HarnessProps = {
  readonly columnFilters?: ColumnFiltersState<Row>;
};

const Harness = ({ columnFilters }: HarnessProps) => (
  <NotificationProvider>
    <TableConfigProvider<Row>
      columnsState={{ columnFilters, columns }}
      metaState={{
        groupingAggregates: AGGREGATES,
        groupingKeys: GROUPING_KEYS,
      }}
    >
      <TableDrawerProvider>
        <FiltersSection />
      </TableDrawerProvider>
    </TableConfigProvider>
  </NotificationProvider>
);

const renderPanel = (props: HarnessProps = {}) => {
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness {...props} />, path: '/' },
      ])}
    />,
  );
};

const pickColumn = (label: string) => {
  fireEvent.click(
    within(screen.getByTestId('Select a column...')).getByRole('button', {
      name: label,
    }),
  );
};

afterEach(cleanup);

describe('FiltersSection while a grouping is applied', () => {
  it('lists a filter on a column the grouping neither keys nor measures, and removes it', () => {
    renderPanel({ columnFilters: STATUS_FILTER });

    expect(document.body.textContent).toContain('Active Filters (1)');
    expect(screen.getByTestId('filter-item-status')).not.toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Status filter' }),
    );

    expect(screen.queryByTestId('filter-item-status')).toBeNull();
    expect(document.body.textContent).toContain('Active Filters (0)');
  });

  it('adds a filter on such a column when the picker offers it', () => {
    renderPanel();

    expect(document.body.textContent).toContain('Active Filters (0)');

    pickColumn('Status');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByTestId('filter-item-status')).not.toBeNull();
    expect(document.body.textContent).toContain('Active Filters (1)');
  });

  it('adds a filter on the column a measure summarises', () => {
    renderPanel();

    pickColumn('Amount');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByTestId('filter-item-amount')).not.toBeNull();
  });

  it('keeps a group key filterable', () => {
    renderPanel();

    pickColumn('Region');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByTestId('filter-item-region')).not.toBeNull();
  });
});
