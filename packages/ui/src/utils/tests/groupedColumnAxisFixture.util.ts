import type {
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

export type GroupedColumnAxisFixtureRow = Record<string, unknown>;

export const groupedColumnAxisFixture = {
  aggregates: [
    { columnKey: 'total_amount', fn: 'sum' },
  ] as readonly TableColumnAggregate[],
  columnAxis: 'order_status',
  columns: [
    { isPrimaryKey: true, key: 'id', label: 'Id' },
    { key: 'customer_type', label: 'Customer Type' },
    { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
    { key: 'order_status', label: 'Status' },
  ] as TableColumn<GroupedColumnAxisFixtureRow>[],
  groupingKeys: ['customer_type'] as const,
  rows: [
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
  ] as readonly GroupedColumnAxisFixtureRow[],
};
