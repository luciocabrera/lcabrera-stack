// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';

type TestRow = Record<string, unknown>;

const GROUPING_KEYS = ['customer_type'];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
];

const groupRow: TestRow = {
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [{ columnKey: 'total_amount', fn: 'avg', value: '2503' }],
    count: 4,
    isSubtotal: false,
    path: [
      { columnKey: 'customer_type', label: 'Business', value: 'Business' },
    ],
  },
};

const detailRow: TestRow = {
  customer_type: 'Business',
  order_id: 7,
  total_amount: 4200,
};

type HarnessProps = {
  readonly rows: readonly TestRow[];
};

const Harness = ({ rows }: HarnessProps) => (
  <NotificationProvider>
    <GroupedTableTestShell
      columns={columns}
      data={rows}
      groupingState={{
        aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
        keys: GROUPING_KEYS,
      }}
      header={<TableHeader />}
      metaState={{
        crud: { delete: true, read: true, update: true },
        deleteActionPath: '/_action/delete',
        title: { plural: 'Orders', singular: 'Order' },
      }}
    />
  </NotificationProvider>
);

const renderGrid = (rows: readonly TestRow[]) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element: <Harness rows={rows} />, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
        { action: () => ({ ok: true }), path: '/_action/delete' },
      ])}
    />,
  );

afterEach(cleanup);

describe('a grouped grid configured for row actions', () => {
  it('renders a group row without asking it for a row id', () => {
    expect(() => renderGrid([groupRow])).not.toThrow();
    expect(screen.getAllByTestId('table-group-header-row')).toHaveLength(1);
  });

  it('survives a group row whose aggregate lost its value to JSON', () => {
    const starved: TestRow = {
      [TABLE_GROUP_ROW_FIELD]: {
        ...(groupRow[TABLE_GROUP_ROW_FIELD] as Record<string, unknown>),
        aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      },
    };

    renderGrid([starved]);

    expect({
      menus: screen.queryAllByLabelText('Row actions').length,
      rows: screen.queryAllByRole('row').length,
      titled: document.querySelectorAll('tbody [role="gridcell"] span[title]')
        .length,
    }).toStrictEqual({ menus: 0, rows: 2, titled: 0 });
  });

  it('renders a detail row with no primary key rather than asking it for one', () => {
    const idless: TestRow = { customer_type: 'Business', total_amount: 4200 };

    renderGrid([groupRow, detailRow, idless]);

    expect({
      menus: screen.queryAllByLabelText('Row actions').length,
      rows: screen.queryAllByRole('row').length,
    }).toStrictEqual({ menus: 0, rows: 4 });
  });

  it('paints no row-actions column, which a grouped read gives nothing to act on', () => {
    renderGrid([groupRow, detailRow]);

    expect({
      headers: screen.getAllByRole('columnheader').length,
      menus: screen.queryAllByLabelText('Row actions').length,
    }).toStrictEqual({ headers: 2, menus: 0 });
  });
});
