import type { SortingState } from '@lcabrera/ui/components/Table';

import { describe, expect, it } from 'vite-plus/test';

import { toKeysetCursorValues } from './toKeysetCursorValues.util';

type Row = {
  readonly order_id: number;
  readonly order_status: string;
  readonly total_amount: null | string;
};

const lastRow: Row = {
  order_id: 42,
  order_status: 'shipped',
  total_amount: '99.50',
};

describe('toKeysetCursorValues', () => {
  it('returns undefined without a last row (the first page)', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toKeysetCursorValues<Row>({ sorting })).toBeUndefined();
  });

  it('reads the sort-key values in sorting order', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status', direction: 'desc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toKeysetCursorValues<Row>({ lastRow, sorting })).toStrictEqual([
      'shipped',
      42,
    ]);
  });

  it('drops the UI-only actions column, which has no row value', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'actions', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toKeysetCursorValues<Row>({ lastRow, sorting })).toStrictEqual([42]);
  });

  it('drops a column with no direction, which the server does not sort by', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(toKeysetCursorValues<Row>({ lastRow, sorting })).toStrictEqual([42]);
  });

  it('preserves a SQL NULL rather than dropping the column', () => {
    // A nullable column arrives as JSON `null`, and the cursor is positional:
    // dropping the slot would misalign every later value against the server's
    // sort. Parsed rather than written as a literal, which is both how the row
    // really reaches this code and what keeps `unicorn/no-null` on for the file.
    const rowWithSqlNull = JSON.parse(
      '{"order_id":42,"order_status":"shipped","total_amount":null}',
    ) as Row;
    const sorting: SortingState<Row> = [
      { columnKey: 'total_amount', direction: 'asc' },
      { columnKey: 'order_id', direction: 'asc' },
    ];

    expect(
      toKeysetCursorValues<Row>({ lastRow: rowWithSqlNull, sorting }),
    ).toStrictEqual(JSON.parse('[null, 42]'));
  });

  it('returns an empty tuple when nothing survives sanitizing', () => {
    expect(toKeysetCursorValues<Row>({ lastRow, sorting: [] })).toStrictEqual(
      [],
    );
  });
});
