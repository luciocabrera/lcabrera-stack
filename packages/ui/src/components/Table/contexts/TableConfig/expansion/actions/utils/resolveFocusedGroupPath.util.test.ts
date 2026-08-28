import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveFocusedGroupPath } from './resolveFocusedGroupPath.util';

type Row = Record<string, unknown>;

const columns = [] as readonly TableColumn<Row>[];

const GROUPING_KEYS = ['city', 'status'];

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'status',
    label,
    value: label,
  }));

type GroupRowArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

const groupRow = ({ isSubtotal = false, path }: GroupRowArgs): Row => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, isSubtotal, path },
});

/** A rollup block plus a detail row, in the order rollup emits them (#570). */
const rows: readonly Row[] = [
  groupRow({ path: pathOf('Berlin', 'Open') }),
  { id: 7 },
  groupRow({ isSubtotal: true, path: pathOf('Berlin') }),
];

const keyOf = (index: number) => {
  const row = rows[index];

  if (row === undefined) throw new Error(`No row at ${index}`);

  return resolveRowKey({ columns, index, row });
};

describe('resolveFocusedGroupPath', () => {
  it('answers a group row with its own path', () => {
    expect(
      resolveFocusedGroupPath({ columns, focusedRowKey: keyOf(0), rows }),
    ).toStrictEqual(pathOf('Berlin', 'Open'));
  });

  it('answers a detail row with the nearest group above it', () => {
    expect(
      resolveFocusedGroupPath({ columns, focusedRowKey: keyOf(1), rows }),
    ).toStrictEqual(pathOf('Berlin', 'Open'));
  });

  it('reads ancestry from the row, never from the row below it', () => {
    // The trap rollup sets: the subtotal for a block is emitted *after* the
    // rows it totals, so a walk that looked forward would hand row 0 the path
    // of row 2 — one level shallower than the row the reader is on.
    expect(
      resolveFocusedGroupPath({ columns, focusedRowKey: keyOf(2), rows }),
    ).toStrictEqual(pathOf('Berlin'));
  });

  it('answers nothing when focus is outside the grid or on an unknown row', () => {
    expect(
      resolveFocusedGroupPath({ columns, focusedRowKey: undefined, rows }),
    ).toBeUndefined();
    expect(
      resolveFocusedGroupPath({
        columns,
        focusedRowKey: 'grp:["not-here"]',
        rows,
      }),
    ).toBeUndefined();
  });

  it('answers nothing when no group row precedes the focused one', () => {
    expect(
      resolveFocusedGroupPath({
        columns,
        focusedRowKey: resolveRowKey({ columns, index: 0, row: { id: 1 } }),
        rows: [{ id: 1 }],
      }),
    ).toBeUndefined();
  });
});
