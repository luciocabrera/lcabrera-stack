import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveOutermostGroupPathKey } from './resolveOutermostGroupPathKey.util';

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

const berlinKey = resolveGroupPathKey(pathOf('Berlin'));

/**
 * A rollup block, in the order rollup emits it: the deepest rows, a detail row
 * drilled under one of them, then the subtotal that totals them (#570), then
 * the grand total.
 */
const rows: readonly Row[] = [
  groupRow({ path: pathOf('Berlin', 'Open') }),
  { id: 7 },
  groupRow({ isSubtotal: true, path: pathOf('Berlin') }),
  groupRow({ isSubtotal: true, path: pathOf() }),
];

const keyOf = (index: number) => {
  const row = rows[index];

  if (row === undefined) throw new Error(`No row at ${index}`);

  return resolveRowKey({ columns, index, row });
};

describe('resolveOutermostGroupPathKey', () => {
  it('answers the top-level ancestor of a deeper group row', () => {
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: keyOf(0),
        rows,
      }),
    ).toBe(berlinKey);
  });

  it('answers the enclosing group of a detail row, which carries no path', () => {
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: keyOf(1),
        rows,
      }),
    ).toBe(berlinKey);
  });

  it('answers a top-level row with itself, so focus never leaves it', () => {
    // A collapse-all cannot hide it — it is nobody's descendant — and the
    // caller compares the answer against the surviving rows, which still
    // contain it.
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: keyOf(2),
        rows,
      }),
    ).toBe(berlinKey);
  });

  it('gives the grand total no ancestor, because no collapse can hide it', () => {
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: keyOf(3),
        rows,
      }),
    ).toBeUndefined();
  });

  it('answers nothing when focus is outside the grid or on an unknown row', () => {
    expect(
      resolveOutermostGroupPathKey({ columns, focusedRowKey: undefined, rows }),
    ).toBeUndefined();
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: 'grp:["not-here"]',
        rows,
      }),
    ).toBeUndefined();
  });

  it('reads ancestry from the row, never from the row above it', () => {
    // The trap rollup sets: the row *above* a top-level group row is the
    // previous group's subtotal, so a walk that started one row early would
    // hand Paris's rows Berlin's ancestor.
    const acrossBlocks: readonly Row[] = [
      groupRow({ isSubtotal: true, path: pathOf('Berlin') }),
      groupRow({ path: pathOf('Paris', 'Open') }),
    ];
    const focusedRowKey = resolveRowKey({
      columns,
      index: 1,
      row: acrossBlocks[1] as Row,
    });

    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey,
        rows: acrossBlocks,
      }),
    ).toBe(resolveGroupPathKey(pathOf('Paris')));
  });

  it('leaves the answer alone when nothing is left to fall back to', () => {
    expect(
      resolveOutermostGroupPathKey({
        columns,
        focusedRowKey: resolveRowKey({ columns, index: 0, row: { id: 1 } }),
        rows: [{ id: 1 }],
      }),
    ).toBeUndefined();
  });
});
