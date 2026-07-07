import type { SortingState, TableColumn } from '@repo/ui/components/Table';

import { describe, expect, it } from 'vitest';

import { appendPrimaryKeySorting } from './appendPrimaryKeySorting.util';

type Row = {
  readonly customer_name: string;
  readonly order_date: string;
  readonly order_id: number;
  readonly order_number: string;
  readonly order_status: string;
};

const col = ({
  isPrimaryKey,
  key,
}: {
  readonly isPrimaryKey?: boolean;
  readonly key: keyof Row;
}): TableColumn<Row> => ({
  isPrimaryKey,
  key,
  label: key,
});

describe('appendPrimaryKeySorting', () => {
  it('appends the single primary key after user sorting (case 1)', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ key: 'order_status' }),
    ];
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status', direction: 'asc' },
    ];

    expect(appendPrimaryKeySorting({ columns, sorting })).toStrictEqual([
      { columnKey: 'order_status', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ]);
  });

  it('uses the primary key alone when there is no user sorting (case 2)', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ key: 'order_status' }),
    ];

    expect(appendPrimaryKeySorting({ columns, sorting: [] })).toStrictEqual([
      { columnKey: 'order_id', direction: 'asc' },
    ]);
  });

  it('appends composite keys in declaration order with no user sorting (case 3)', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ isPrimaryKey: true, key: 'order_number' }),
    ];

    expect(appendPrimaryKeySorting({ columns, sorting: [] })).toStrictEqual([
      { columnKey: 'order_id', direction: 'asc' },
      { columnKey: 'order_number', direction: 'asc' },
    ]);
  });

  it('appends composite keys after multi-column user sorting (case 4)', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ isPrimaryKey: true, key: 'order_number' }),
      col({ isPrimaryKey: true, key: 'order_date' }),
      col({ key: 'order_status' }),
      col({ key: 'customer_name' }),
    ];
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status', direction: 'asc' },
      { columnKey: 'customer_name', direction: 'desc' },
    ];

    expect(appendPrimaryKeySorting({ columns, sorting })).toStrictEqual([
      { columnKey: 'order_status', direction: 'asc' },
      { columnKey: 'customer_name', direction: 'desc' },
      { columnKey: 'order_id', direction: 'asc' },
      { columnKey: 'order_number', direction: 'asc' },
      { columnKey: 'order_date', direction: 'asc' },
    ]);
  });

  it('does not duplicate a primary-key column the user already sorts by', () => {
    const columns = [
      col({ isPrimaryKey: true, key: 'order_id' }),
      col({ isPrimaryKey: true, key: 'order_number' }),
    ];
    const sorting: SortingState<Row> = [
      { columnKey: 'order_number', direction: 'desc' },
      { columnKey: 'customer_name', direction: 'asc' },
    ];

    expect(appendPrimaryKeySorting({ columns, sorting })).toStrictEqual([
      { columnKey: 'order_number', direction: 'desc' },
      { columnKey: 'customer_name', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ]);
  });
});
