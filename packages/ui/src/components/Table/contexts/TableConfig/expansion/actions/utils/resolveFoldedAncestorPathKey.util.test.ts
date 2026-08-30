import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveFoldedAncestorPathKey } from './resolveFoldedAncestorPathKey.util';

type Row = Record<string, unknown>;

const columns = [] as readonly TableColumn<Row>[];

const GROUPING_KEYS = ['city', 'status', 'priority'];

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'priority',
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

/** A rollup block plus one detail row, in the order rollup emits them (#570). */
const rows: readonly Row[] = [
  groupRow({ path: pathOf('Berlin', 'Open', 'High') }),
  { id: 7 },
  groupRow({ isSubtotal: true, path: pathOf('Berlin', 'Open') }),
  groupRow({ isSubtotal: true, path: pathOf('Berlin') }),
  groupRow({ isSubtotal: true, path: pathOf() }),
];

const berlinOpen = resolveGroupPathKey(pathOf('Berlin', 'Open'));
const berlin = resolveGroupPathKey(pathOf('Berlin'));

const levelPaths: ReadonlySet<string> = new Set([berlinOpen]);

const keyOf = (index: number) => {
  const row = rows[index];

  if (row === undefined) throw new Error(`No row at ${index}`);

  return resolveRowKey({ columns, index, row });
};

describe('resolveFoldedAncestorPathKey', () => {
  it('answers the group this fold closed around the focused row', () => {
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(0),
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBe(berlinOpen);
  });

  it('answers the same for a detail row, which carries no path of its own', () => {
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(1),
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBe(berlinOpen);
  });

  it('names no ancestor for a row this fold cannot hide', () => {
    // The `[Berlin]` subtotal is above the folded level, so it survives and
    // focus must be left exactly where it is. An answer of `[Berlin]` here
    // would move focus on a fold that took nothing away from the reader.
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(3),
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBeUndefined();
  });

  it('leaves the folded group itself alone, because its own row survives', () => {
    // Row 2 *is* `[Berlin, Open]`. A collapse hides a group's descendants and
    // never its own row (ADR-067), so there is nothing to move away from —
    // and the prefix scan must not answer with the row's own path.
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(2),
        foldedPaths: new Set([berlin]),
        rows,
      }),
    ).toBe(berlin);
  });

  it('takes the outermost of several closed levels, not the nearest', () => {
    // Both prefixes are folded; the reader has to land on the one that is still
    // on screen, which is the shallower of the two.
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(0),
        foldedPaths: new Set([berlin, berlinOpen]),
        rows,
      }),
    ).toBe(berlin);
  });

  it('answers nothing when the fold closed no ancestor of the focused row', () => {
    const elsewhere: ReadonlySet<string> = new Set([
      resolveGroupPathKey(pathOf('Paris')),
    ]);

    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(0),
        foldedPaths: elsewhere,
        rows,
      }),
    ).toBeUndefined();
  });

  it('answers nothing when focus is outside the grid or on an unknown row', () => {
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: undefined,
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBeUndefined();
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: 'grp:["not-here"]',
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBeUndefined();
  });

  it('gives the grand total no ancestor, because no collapse can hide it', () => {
    expect(
      resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: keyOf(4),
        foldedPaths: levelPaths,
        rows,
      }),
    ).toBeUndefined();
  });
});
