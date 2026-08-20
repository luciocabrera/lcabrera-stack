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
  aggregates: [],
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
  aggregates = [],
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
          aggregates: [{ columnKey: 'id', fn: 'sum' }],
          keys: ['status'],
          mode: 'flat',
          periods: {},
          shares: [],
        }),
      }),
    ).toStrictEqual(
      grouping({
        aggregates: [{ columnKey: 'id', fn: 'sum' }],
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
          aggregates: [{ columnKey: 'not_a_column', fn: 'sum' }],
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

  it('keeps a share on an additive measure', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [{ columnKey: 'name', fn: 'count' }],
          keys: ['status'],
          shares: [{ columnKey: 'name', fn: 'count' }],
        }),
      }).shares,
    ).toStrictEqual([{ columnKey: 'name', fn: 'count' }]);
  });

  it('refuses the whole configuration for a share on a non-additive one', () => {
    // Whole-state refusal, like every other illegal member (ADR-061): a link
    // promising a percentage column that silently does not appear is the
    // failure that rule exists to avoid — and here the percentage it promised
    // would have been wrong rather than merely missing (#648).
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [{ columnKey: 'name', fn: 'avg' }],
          keys: ['status'],
          shares: [{ columnKey: 'name', fn: 'avg' }],
        }),
      }).keys,
    ).toStrictEqual([]);
  });

  it('refuses a share naming an aggregate that is not applied', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          keys: ['status'],
          shares: [{ columnKey: 'name', fn: 'count' }],
        }),
      }).keys,
    ).toStrictEqual([]);
  });

  it('refuses a share whose function the column does not carry', () => {
    // The pair is the identity: `count(name)` is applied and `sum(name)` is not,
    // so a share of the second names a measure the read will not produce (#831).
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [{ columnKey: 'name', fn: 'count' }],
          keys: ['status'],
          shares: [{ columnKey: 'name', fn: 'sum' }],
        }),
      }).keys,
    ).toStrictEqual([]);
  });

  it('keeps two aggregates on one column, in order', () => {
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [
            { columnKey: 'name', fn: 'count' },
            { columnKey: 'name', fn: 'max' },
          ],
          keys: ['status'],
        }),
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'name', fn: 'count' },
      { columnKey: 'name', fn: 'max' },
    ]);
  });

  it('refuses a repeated aggregate pair, as it refuses a repeated key', () => {
    // The pair is an aggregate's identity, so a repeat gives the staged list two
    // rows nothing can tell apart (#831).
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [
            { columnKey: 'name', fn: 'count' },
            { columnKey: 'name', fn: 'count' },
          ],
          keys: ['status'],
        }),
      }).keys,
    ).toStrictEqual([]);
  });

  it('refuses a repeated share, as it refuses a repeated key', () => {
    // Every reader downstream treats the shares as a set, so a duplicate makes
    // the change detector compare a length against a set's size and report a
    // change where there is none (#648).
    expect(
      sanitizeGroupingByColumns({
        columns,
        grouping: grouping({
          aggregates: [{ columnKey: 'name', fn: 'count' }],
          keys: ['status'],
          shares: [
            { columnKey: 'name', fn: 'count' },
            { columnKey: 'name', fn: 'count' },
          ],
        }),
      }).keys,
    ).toStrictEqual([]);
  });
});
