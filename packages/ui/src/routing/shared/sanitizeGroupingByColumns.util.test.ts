import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';

import { createActionsColumn } from '#ui/components/Table/utils/createActionsColumn.util';

import { sanitizeGroupingByColumns } from './sanitizeGroupingByColumns.util';

type Row = {
  readonly id: number;
  readonly name: string;
  readonly status: string;
};

// Spelled from `createActionsColumn`'s own flags rather than by hand, so this
// suite reads the actions column the table actually builds — the point being
// that this util refuses it through `isGroupable`, never through its key.
const { isGroupable, isStatic } = createActionsColumn<Row>();

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { isGroupable, isStatic, key: 'actions', label: 'Actions' },
];

describe('sanitizeGroupingByColumns', () => {
  it('keeps keys that name a groupable column', () => {
    expect(
      sanitizeGroupingByColumns({ columns, grouping: ['status'] }),
    ).toStrictEqual(['status']);
  });

  it('preserves key order, which is the query nesting order', () => {
    expect(
      sanitizeGroupingByColumns({ columns, grouping: ['status', 'name'] }),
    ).toStrictEqual(['status', 'name']);
  });

  it('refuses the whole list when one key names no column', () => {
    // `status` is legal and still goes: a partly-applied key list would run a
    // query nobody described.
    expect(
      sanitizeGroupingByColumns({ columns, grouping: ['status', 'nope'] }),
    ).toStrictEqual([]);
  });

  it('refuses a column that declares isGroupable: false', () => {
    const withLockedColumn: TableColumn<Row>[] = [
      { isGroupable: false, key: 'id', label: 'ID' },
      { key: 'status', label: 'Status' },
    ];

    expect(
      sanitizeGroupingByColumns({
        columns: withLockedColumn,
        grouping: ['id'],
      }),
    ).toStrictEqual([]);
  });

  it('refuses the row-actions column, which is never a group key', () => {
    expect(
      sanitizeGroupingByColumns({ columns, grouping: ['actions'] }),
    ).toStrictEqual([]);
  });

  it('refuses a duplicated key', () => {
    expect(
      sanitizeGroupingByColumns({ columns, grouping: ['status', 'status'] }),
    ).toStrictEqual([]);
  });

  it('answers no keys for no keys', () => {
    expect(sanitizeGroupingByColumns({ columns, grouping: [] })).toStrictEqual(
      [],
    );
  });

  it('answers no keys when the route declares no columns at all', () => {
    expect(
      sanitizeGroupingByColumns<Row>({ columns: [], grouping: ['status'] }),
    ).toStrictEqual([]);
  });
});
