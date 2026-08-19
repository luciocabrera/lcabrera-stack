import { describe, expect, it } from 'vite-plus/test';

import type {
  TableGroupDrill,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { resolveDrilledBlock } from './resolveDrilledBlock.util';

const PATH_KEY = 'region:Iberia';

const summary: TableGroupRowSummary = {
  aggregates: [],
  count: 9,
  isSubtotal: false,
  path: [{ columnKey: 'region', label: 'Iberia', value: 'Iberia' }],
};

const GROUP_ROW = { [TABLE_GROUP_ROW_FIELD]: summary };

type ResolveArgs = {
  readonly drill?: TableGroupDrill;
  readonly isCollapsed?: boolean;
  readonly isDrillable?: boolean;
  readonly row?: Record<string, unknown>;
};

const resolve = ({
  drill = { rows: [{ id: 1 }, { id: 2 }], status: 'loaded' },
  isCollapsed = false,
  isDrillable = true,
  row = GROUP_ROW,
}: ResolveArgs = {}) =>
  resolveDrilledBlock({
    drill,
    isCollapsed,
    isDrillable,
    level: 1,
    pathKey: PATH_KEY,
    row,
  });

describe('resolveDrilledBlock', () => {
  it('pairs every row with its own metadata', () => {
    // `TableBody` sizes `<tbody>` from `rows.length` and the focus model indexes
    // both arrays by the same number, so a row without its meta is a grid whose
    // painted height and navigable extent disagree.
    const block = resolve();

    expect(block).toHaveLength(3);
    for (const entry of block) {
      expect(entry.row).toBeDefined();
      expect(entry.meta).toBeDefined();
    }
  });

  it('places the block one level below the group it was fetched for', () => {
    expect(resolve()[0]?.meta.level).toBe(2);
  });

  it('counts the block among itself, not among the group’s own siblings', () => {
    const block = resolve();

    expect(block.map((entry) => entry.meta.posInSet)).toEqual([1, 2, 3]);
    expect(block[0]?.meta.setSize).toBe(3);
  });

  it('contributes nothing for a row that cannot drill', () => {
    expect(resolve({ isDrillable: false })).toHaveLength(0);
  });

  it('contributes nothing without a path key to store the drill under', () => {
    // Called directly rather than through `resolve`: a default parameter would
    // substitute the key back in, and the test would assert nothing.
    expect(
      resolveDrilledBlock({
        drill: { rows: [{ id: 1 }], status: 'loaded' },
        isCollapsed: false,
        isDrillable: true,
        level: 1,
        pathKey: undefined,
        row: GROUP_ROW,
      }),
    ).toHaveLength(0);
  });

  it('contributes nothing for a row carrying no summary', () => {
    // A drillable flag and a row that is not a group row disagree; the row is
    // what the grid asks, so it wins.
    expect(resolve({ row: { id: 1 } })).toHaveLength(0);
  });

  it('says nothing is under a folded group, keeping the entry', () => {
    expect(resolve({ isCollapsed: true })).toHaveLength(0);
  });
});
