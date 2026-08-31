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

const rollup: readonly Row[] = [
  groupRow({ path: pathOf('Elec', 'Phones', 'Retail') }),
  groupRow({ path: pathOf('Elec', 'Phones', 'Corporate') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec', 'Phones') }),
  groupRow({ path: pathOf('Elec', 'Tablets', 'Retail') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec', 'Tablets') }),
  groupRow({ isSubtotal: true, path: pathOf('Elec') }),
  groupRow({ isSubtotal: true, path: pathOf() }),
];

const flat: readonly Row[] = [
  groupRow({ path: pathOf('Elec', 'Phones', 'Retail') }),
  groupRow({ path: pathOf('Elec', 'Phones', 'Corporate') }),
];

const NOTHING_COLLAPSED: ReadonlySet<string> = new Set<string>();

const PHONES = resolveGroupPathKey(pathOf('Elec', 'Phones'));
const TABLETS = resolveGroupPathKey(pathOf('Elec', 'Tablets'));
const ELEC = resolveGroupPathKey(pathOf('Elec'));

const sorted = (paths: ReadonlySet<string>) =>
  [...paths].toSorted((a, b) => a.localeCompare(b));

type LevelArgs = {
  readonly collapsedGroupPaths?: ReadonlySet<string>;
  readonly columnKey: string;
  readonly data?: readonly Row[];
};

const foldPathsFor = ({
  collapsedGroupPaths = NOTHING_COLLAPSED,
  columnKey,
  data = rollup,
}: LevelArgs) =>
  sorted(
    collectGroupLevelFoldPaths({
      columnKey,
      rowMeta: resolveTableGroupTree({ collapsedGroupPaths, data }).rowMeta,
    }),
  );

describe('collectGroupLevelFoldPaths', () => {
  it('names the groups the column itself states', () => {
    expect(foldPathsFor({ columnKey: 'subcategory' })).toStrictEqual(
      sorted(new Set([PHONES, TABLETS])),
    );
  });

  it('never names the level above the column', () => {
    expect(foldPathsFor({ columnKey: 'subcategory' })).not.toContain(ELEC);
  });

  it('names the outermost key’s own groups, which survive their fold', () => {
    expect(foldPathsFor({ columnKey: 'category' })).toStrictEqual([ELEC]);
  });

  it('names nothing on the innermost key, whose groups own no rows', () => {
    expect(foldPathsFor({ columnKey: 'customerType' })).toStrictEqual([]);
  });

  it('names nothing on a column that is not an applied key', () => {
    expect(foldPathsFor({ columnKey: 'total_amount' })).toStrictEqual([]);
  });

  it('names nothing under `flat`, where no level renders a row', () => {
    expect(
      foldPathsFor({ columnKey: 'subcategory', data: flat }),
    ).toStrictEqual([]);
  });

  it('names each group once however many rows sit inside it', () => {
    expect(
      foldPathsFor({ columnKey: 'subcategory' }).filter(
        (pathKey) => pathKey === PHONES,
      ),
    ).toHaveLength(1);
  });

  it('keeps naming a group it has already folded, so the fold can be undone', () => {
    expect(
      foldPathsFor({
        collapsedGroupPaths: new Set([PHONES]),
        columnKey: 'subcategory',
      }),
    ).toStrictEqual(sorted(new Set([PHONES, TABLETS])));
  });

  it('ignores rows that carry no group summary at all', () => {
    expect(
      foldPathsFor({ columnKey: 'subcategory', data: [...rollup, { id: 7 }] }),
    ).toStrictEqual(foldPathsFor({ columnKey: 'subcategory' }));
  });

  describe('names, per column, exactly the foldable groups of the fixture', () => {
    const EXPECTED: Record<string, readonly string[]> = {
      category: [ELEC],
      customerType: [],
      subcategory: sorted(new Set([PHONES, TABLETS])),
    };

    for (const columnKey of GROUPING_KEYS) {
      it(`on ${columnKey}, with nothing folded`, () => {
        expect(foldPathsFor({ columnKey })).toStrictEqual(EXPECTED[columnKey]);
      });

      it(`on ${columnKey}, with a middle group already folded`, () => {
        expect(
          foldPathsFor({ collapsedGroupPaths: new Set([PHONES]), columnKey }),
        ).toStrictEqual(EXPECTED[columnKey]);
      });
    }
  });
});
