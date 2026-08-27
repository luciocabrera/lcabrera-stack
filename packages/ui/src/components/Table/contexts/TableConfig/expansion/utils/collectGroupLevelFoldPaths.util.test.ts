import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { collectGroupLevelFoldPaths } from './collectGroupLevelFoldPaths.util';
import { resolveTableGroupTree } from './resolveTableGroupTree.util';

type Row = Record<string, unknown>;

const GROUPING_KEYS = ['category', 'subcategory', 'customerType'];

const pathOf = (...labels: readonly string[]): readonly TableGroupKeyValue[] =>
  labels.map((label, index) => ({
    columnKey: GROUPING_KEYS[index] ?? 'customerType',
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

/**
 * A three-level rollup in the order rollup emits it — every subtotal after the
 * rows it totals (#570), the grand total last (ADR-065).
 */
const rollup: readonly Row[] = [
  groupRow({ path: pathOf('Elec', 'Phones', 'Retail') }),
  groupRow({ path: pathOf('Elec', 'Phones', 'Corporate') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec', 'Phones') }),
  groupRow({ path: pathOf('Elec', 'Tablets', 'Retail') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec', 'Tablets') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec') }),
  groupRow({ isSubtotal: true, path: pathOf() }),
];

/** The same key list with no subtotals: one grouping set, every row full depth. */
const flat: readonly Row[] = [
  groupRow({ path: pathOf('Elec', 'Phones', 'Retail') }),
  groupRow({ path: pathOf('Elec', 'Phones', 'Corporate') }),
];

const NOTHING_COLLAPSED: ReadonlySet<string> = new Set<string>();

type FoldPathsForArgs = {
  readonly columnKey: string;
  readonly data?: readonly Row[];
};

/**
 * The foldable set is taken from the real tree rather than hand-written, so the
 * paths this selects are exactly the ones the chevrons are drawn from — which is
 * the whole property ADR-083 asks of it.
 */
const foldPathsFor = ({ columnKey, data = rollup }: FoldPathsForArgs) => {
  const { foldableGroupPaths } = resolveTableGroupTree({
    collapsedGroupPaths: NOTHING_COLLAPSED,
    data,
  });

  return [
    ...collectGroupLevelFoldPaths({
      columnKey,
      data,
      foldableGroupPaths,
      groupingKeys: GROUPING_KEYS,
    }),
  ].toSorted((a, b) => a.localeCompare(b));
};

describe('collectGroupLevelFoldPaths', () => {
  it('folds the level above the column, which is what removes its values', () => {
    // `customerType` is the third key, so what has to close is every
    // subcategory group: the customer-type rows are their descendants, and the
    // subcategory subtotals survive to reopen them.
    expect(foldPathsFor({ columnKey: 'customerType' })).toStrictEqual(
      [
        resolveGroupPathKey(pathOf('Elec', 'Phones')),
        resolveGroupPathKey(pathOf('Elec', 'Tablets')),
      ].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('never names the level the column itself states', () => {
    // The discriminating half of the test above: folding `[Elec, Phones]`
    // itself would take the subcategory row away too, which is the outcome the
    // reader asked *not* to have.
    expect(foldPathsFor({ columnKey: 'customerType' })).not.toContain(
      resolveGroupPathKey(pathOf('Elec', 'Phones', 'Retail')),
    );
  });

  it('answers one level up for a middle key, not the deepest one', () => {
    expect(foldPathsFor({ columnKey: 'subcategory' })).toStrictEqual([
      resolveGroupPathKey(pathOf('Elec')),
    ]);
  });

  it('offers nothing on the outermost key, where no row would survive', () => {
    // ADR-083 read off the tree rather than spelled as an index check: the
    // level above `category` is the root, which no row renders, so it never
    // enters the foldable set in the first place.
    expect(foldPathsFor({ columnKey: 'category' })).toStrictEqual([]);
  });

  it('offers nothing on a column that is not an applied key', () => {
    // And specifically does not read `slice(0, -1)` — "every entry but the
    // last" — out of `indexOf`'s miss.
    expect(foldPathsFor({ columnKey: 'total_amount' })).toStrictEqual([]);
  });

  it('offers nothing under `flat`, where every level above is undrawn', () => {
    // `[Elec, Phones]` is the parent of both rows and no row *is* it, so
    // folding it would hide the group with nothing left to reopen it from.
    expect(
      foldPathsFor({ columnKey: 'customerType', data: flat }),
    ).toStrictEqual([]);
  });

  it('names each group once however many rows sit inside it', () => {
    // Two customer-type rows live under `[Elec, Phones]`; the write is a set of
    // paths, not one entry per row.
    expect(
      foldPathsFor({ columnKey: 'customerType' }).filter(
        (pathKey) => pathKey === resolveGroupPathKey(pathOf('Elec', 'Phones')),
      ),
    ).toHaveLength(1);
  });

  it('ignores rows shallower than the level being folded', () => {
    // The `[Elec]` subtotal is above this level. Slicing its path to depth two
    // yields `[Elec]` — a real, foldable, and *wrong* group — so the guard has
    // to skip the row rather than clamp it.
    expect(foldPathsFor({ columnKey: 'customerType' })).not.toContain(
      resolveGroupPathKey(pathOf('Elec')),
    );
  });

  it('ignores rows that carry no group summary at all', () => {
    expect(
      foldPathsFor({ columnKey: 'customerType', data: [...rollup, { id: 7 }] }),
    ).toStrictEqual(foldPathsFor({ columnKey: 'customerType' }));
  });
});
