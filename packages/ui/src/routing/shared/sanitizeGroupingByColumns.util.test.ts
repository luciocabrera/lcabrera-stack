import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
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

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly keys: readonly string[];
  readonly mode?: TableGroupingState['mode'];
  readonly periods?: TableGroupingState['periods'];
  readonly shares?: TableGroupingState['shares'];
};

const grouping = ({
  aggregates = {},
  keys,
  mode = 'flat',
  periods = {},
  shares = [],
}: GroupingArgs): TableGroupingState => ({
  aggregates,
  keys,
  mode,
  periods,
  shares,
});

describe('sanitizeGroupingByColumns', () => {
  it('keeps keys that name a groupable column', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({ keys: ['status'] }),
      }),
    ).toStrictEqual(grouping({ keys: ['status'] }));
  });

  it('preserves key order, which is the query nesting order', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({ keys: ['status', 'name'] }),
      }),
    ).toStrictEqual(grouping({ keys: ['status', 'name'] }));
  });

  it('keeps an aggregate on a column this route declares', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: { id: 'sum' },
          keys: ['status'],
          mode: 'flat',
          periods: {},
          shares: [],
        }),
      }),
    ).toStrictEqual(
      grouping({
        aggregates: { id: 'sum' },
        keys: ['status'],
        mode: 'flat',
        periods: {},
        shares: [],
      }),
    );
  });

  it('refuses the whole configuration when one key names no column', () => {
    // `status` is legal and still goes: a partly-applied key list would run a
    // query nobody described.
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({ keys: ['status', 'nope'] }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('refuses the whole configuration when an aggregate names no column', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: { not_a_column: 'sum' },
          keys: ['status'],
          mode: 'flat',
          periods: {},
          shares: [],
        }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('refuses a column that declares isGroupable: false', () => {
    const withLockedColumn: TableColumn<Row>[] = [
      { isGroupable: false, key: 'id', label: 'ID' },
      { key: 'status', label: 'Status' },
    ];

    expect(
      sanitizeGroupingByColumns({
        columns: withLockedColumn,
        grouping: grouping({ keys: ['id'] }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('refuses the row-actions column, which is never a group key', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({ keys: ['actions'] }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('refuses a duplicated key', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({ keys: ['status', 'status'] }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('refuses a key list past the depth cap while accepting the cap itself', () => {
    // Every key here is legal on its own; the list is one too long. Truncating
    // would group by a prefix of what the URL describes and say nothing.
    const declaredColumns: TableColumn<Record<string, unknown>>[] = Array.from(
      { length: MAX_TABLE_GROUP_KEYS + 1 },
      (_, index) => ({ key: `key_${index}`, label: `Key ${index}` }),
    );
    const keys = declaredColumns.map((column) => String(column.key));

    expect(
      sanitizeGroupingByColumns({
        columns: declaredColumns,
        grouping: grouping({ keys }),
      }),
    ).toStrictEqual(NO_GROUPING);
    const atTheCap = sanitizeGroupingByColumns({
      columns: declaredColumns,
      grouping: grouping({ keys: keys.slice(0, MAX_TABLE_GROUP_KEYS) }),
    });

    expect(atTheCap.keys).toHaveLength(MAX_TABLE_GROUP_KEYS);
  });

  it('answers no grouping for no keys', () => {
    expect(
      sanitizeGroupingByColumns({ columns, grouping: NO_GROUPING }),
    ).toStrictEqual(NO_GROUPING);
  });

  it('answers no grouping when the route declares no columns at all', () => {
    expect(
      sanitizeGroupingByColumns<Row>({
        columns: [],
        grouping: grouping({ keys: ['status'] }),
      }),
    ).toStrictEqual(NO_GROUPING);
  });
});
