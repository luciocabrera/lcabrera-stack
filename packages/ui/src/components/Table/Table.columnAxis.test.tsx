// @vitest-environment jsdom

import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { TableHeader } from '#ui/components/Table/TableHeader';
import { NotificationProvider } from '#ui/contexts/NotificationContext';
import { GroupedTableTestShell } from '#ui/utils/tests/groupedTableTestShell.util';
import { renderGroupedTableRoute } from '#ui/utils/tests/renderGroupedTableRoute.util';

type TestRow = Record<string, unknown>;

const GROUPING_KEYS = ['customer_type'];

const AGGREGATES: readonly TableColumnAggregate[] = [
  { columnKey: 'total_amount', fn: 'sum' },
];

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
  { key: 'order_status', label: 'Status' },
];

const rows: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [
        {
          alias: 'sum_total_amount_c0',
          axis: { value: 'Pending' },
          columnKey: 'total_amount',
          fn: 'sum',
          value: '100',
        },
        {
          alias: 'sum_total_amount_c1',
          axis: { value: 'Shipped' },
          columnKey: 'total_amount',
          fn: 'sum',
          value: '250',
        },
      ],
      count: 4,
      isSubtotal: false,
      path: [
        {
          columnKey: 'customer_type',
          label: 'Business',
          value: 'Business',
        },
      ],
    },
  },
];

const Harness = () => (
  <NotificationProvider>
    <GroupedTableTestShell
      columns={columns}
      data={rows}
      groupingState={{
        aggregates: AGGREGATES,
        columnAxis: 'order_status',
        keys: GROUPING_KEYS,
      }}
      header={<TableHeader />}
    />
  </NotificationProvider>
);

const headerLabels = () =>
  screen.getAllByTestId('table-header-label').map((el) => el.textContent);

describe('a grouped grid with a column axis', () => {
  afterEach(cleanup);

  it('paints unique axis values as headers with the measure in the cells', async () => {
    renderGroupedTableRoute(<Harness />);

    await waitFor(() => {
      expect(headerLabels()).toStrictEqual([
        'Customer Type',
        'Pending',
        'Shipped',
      ]);
    });

    expect(screen.getByTestId('table-group-header-row').textContent).toBe(
      'Business100250',
    );
  });
});
