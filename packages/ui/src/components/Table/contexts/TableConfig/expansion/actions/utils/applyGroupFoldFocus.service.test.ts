import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableFocusState,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getInitialFocusState } from '#ui/components/Table/contexts/TableFocus/focus/utils';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { applyGroupFoldFocus } from './applyGroupFoldFocus.service';

type Row = Record<string, unknown>;

const columns = [] as readonly TableColumn<Row>[];

const GROUPING_KEYS = ['city', 'status'];

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'status',
    label,
    value: label,
  }));

const groupRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, isSubtotal: true, path },
});

/** What a fold of `[Berlin]` leaves standing: its own row, and nothing under it. */
const survivors: readonly Row[] = [groupRow(pathOf('Berlin'))];

const berlin = resolveGroupPathKey(pathOf('Berlin'));

const unsubscribe = () => {};

const createFocusStore = (initial: TableFocusState) => {
  let state = initial;

  const store: TStore<TableFocusState> = {
    get: () => state,
    getServerSnapshot: () => state,
    reset: () => {},
    set: (value) => {
      state = { ...state, ...value };
    },
    subscribe: () => unsubscribe,
  };

  return store;
};

const focusStateOn = (rowKey: string): TableFocusState => ({
  ...getInitialFocusState(),
  columnKey: 'city',
  isGridFocused: false,
  rowIndex: 5,
  rowKey,
});

describe('applyGroupFoldFocus', () => {
  it('re-points focus at the row the fold left standing', () => {
    // The focused row is gone from `rows`, which is what a fold that hid it
    // looks like from here.
    const focusState = focusStateOn(
      'grp:[["city","Berlin"],["status","Open"]]',
    );
    const focusStore = createFocusStore(focusState);

    applyGroupFoldFocus({
      columns,
      container: undefined,
      focusState,
      focusStore,
      groupPathKey: berlin,
      rowHeight: 40,
      rows: survivors,
    });

    expect(focusStore.get().rowKey).toBe(
      resolveRowKey({ columns, index: 0, row: survivors[0] as Row }),
    );
    expect(focusStore.get().rowIndex).toBe(0);
  });

  it('leaves focus where it was when the fold closed no group around it', () => {
    // The ordinary case, not an error one: a fold whose focused row survived
    // names no group, and all three fold actions reach here anyway.
    const focusState = focusStateOn('grp:[["city","Paris"]]');
    const focusStore = createFocusStore(focusState);

    applyGroupFoldFocus({
      columns,
      container: undefined,
      focusState,
      focusStore,
      groupPathKey: undefined,
      rowHeight: 40,
      rows: survivors,
    });

    expect(focusStore.get()).toStrictEqual(focusState);
  });

  it('leaves focus where it was when the focused row is still drawn', () => {
    const rowKey = resolveRowKey({
      columns,
      index: 0,
      row: survivors[0] as Row,
    });
    const focusState = focusStateOn(rowKey);
    const focusStore = createFocusStore(focusState);

    applyGroupFoldFocus({
      columns,
      container: undefined,
      focusState,
      focusStore,
      groupPathKey: berlin,
      rowHeight: 40,
      rows: survivors,
    });

    expect(focusStore.get()).toStrictEqual(focusState);
  });
});
