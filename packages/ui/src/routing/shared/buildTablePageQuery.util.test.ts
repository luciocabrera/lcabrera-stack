import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

import { buildTablePageQuery } from './buildTablePageQuery.util';

type Row = {
  readonly order_id: number;
  readonly order_status: string;
};

const col = ({
  isPrimaryKey,
  key,
}: {
  readonly isPrimaryKey?: boolean;
  readonly key: keyof Row;
}): TableColumn<Row> => ({ isPrimaryKey, key, label: key });

const columns = [
  col({ isPrimaryKey: true, key: 'order_id' }),
  col({ key: 'order_status' }),
];

const lastRow: Row = { order_id: 42, order_status: 'shipped' };

describe('buildTablePageQuery', () => {
  it('appends the primary-key tiebreaker to the user sorting', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status', direction: 'desc' },
    ];

    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns, sorting },
        limit: 50,
        skip: 0,
      }).sorting,
    ).toStrictEqual([
      { columnKey: 'order_status', direction: 'desc' },
      { columnKey: 'order_id', direction: 'asc' },
    ]);
  });

  it('sorts by the primary key alone when the user has not sorted', () => {
    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns },
        limit: 50,
        skip: 0,
      }).sorting,
    ).toStrictEqual([{ columnKey: 'order_id', direction: 'asc' }]);
  });

  it('passes limit and skip straight through', () => {
    const query = buildTablePageQuery<Row>({
      columnsState: { columns },
      limit: 25,
      skip: 100,
    });

    expect(query.limit).toBe(25);
    expect(query.skip).toBe(100);
  });

  it('omits the cursor for an offset-only read', () => {
    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns },
        limit: 50,
        skip: 50,
      }).cursor,
    ).toBeUndefined();
  });

  it('derives the cursor from lastRow against the effective sorting', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'order_status', direction: 'desc' },
    ];

    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns, sorting },
        lastRow,
        limit: 50,
        skip: 50,
      }).cursor,
    ).toStrictEqual(['shipped', 42]);
  });

  it('omits the filter when the caller passes none', () => {
    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns },
        limit: 50,
        skip: 0,
      }).filter,
    ).toBeUndefined();
  });

  it('forwards the filter when the caller passes one', () => {
    const filter = {
      order_status: { operator: 'equals', value: 'shipped' },
    } as unknown as ColumnFiltersState<Row>;

    expect(
      buildTablePageQuery<Row>({
        columnsState: { columns },
        filter,
        limit: 50,
        skip: 0,
      }).filter,
    ).toBe(filter);
  });

  it('drops an undirected sort entry before building the cursor', () => {
    const sorting: SortingState<Row> = [{ columnKey: 'order_status' }];

    const query = buildTablePageQuery<Row>({
      columnsState: { columns, sorting },
      lastRow,
      limit: 50,
      skip: 50,
    });

    expect(query.sorting).toStrictEqual([
      { columnKey: 'order_id', direction: 'asc' },
    ]);
    expect(query.cursor).toStrictEqual([42]);
  });
});
