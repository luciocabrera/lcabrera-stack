import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { resolveTableGroupTree } from './resolveTableGroupTree.util';

type Row = Record<string, unknown>;

const groupRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 2, path },
});

const paris = [{ columnKey: 'city', label: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin' }];
const berlinOpen = [
  { columnKey: 'city', label: 'Berlin' },
  { columnKey: 'status', label: 'Open' },
];

/**
 * Two roots, the second carrying a nested level:
 *
 * ```
 * 0  Paris
 * 1    {id: 1}
 * 2    {id: 2}
 * 3  Berlin
 * 4    Berlin / Open
 * 5      {id: 3}
 * ```
 */
const rows: readonly Row[] = [
  groupRow(paris),
  { id: 1 },
  { id: 2 },
  groupRow(berlin),
  groupRow(berlinOpen),
  { id: 3 },
];

const noneCollapsed = new Set<string>();

describe('resolveTableGroupTree', () => {
  it('returns the caller data by reference when the rows are not a tree', () => {
    // The identity check is the point: an ungrouped grid re-derives this on
    // every scroll frame, and must not pay a per-row allocation for a tree it
    // does not have.
    const flat: readonly Row[] = [{ id: 1 }, { id: 2 }];
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: flat,
    });

    expect(tree.isTreeGrid).toBe(false);
    expect(tree.rows).toBe(flat);
    expect(tree.rowMeta).toBeUndefined();
  });

  it('leaves every row standing while nothing is collapsed', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: rows,
    });

    expect(tree.isTreeGrid).toBe(true);
    expect(tree.rows).toHaveLength(rows.length);
    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([
      1, 2, 2, 1, 2, 3,
    ]);
  });

  it('hides a collapsed group’s whole subtree and nothing beside it', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([resolveGroupPathKey(paris)]),
      data: rows,
    });

    // Paris survives; its two details are gone; the Berlin branch is untouched.
    expect(tree.rows).toHaveLength(4);
    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([1, 1, 2, 3]);
    expect(tree.rowMeta?.[0]?.isExpanded).toBe(false);
    expect(tree.rowMeta?.[1]?.isExpanded).toBe(true);
  });

  it('hides a nested group and its rows when the ancestor closes', () => {
    // The discriminating case for prefix ancestry: collapsing Berlin has to
    // take Berlin/Open with it, and Berlin/Open is a group row of its own that
    // a per-row "is my path collapsed" test would have left standing.
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([resolveGroupPathKey(berlin)]),
      data: rows,
    });

    expect(tree.rows).toHaveLength(4);
    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([1, 2, 2, 1]);
  });

  it('counts a row’s position among its own siblings, not across the grid', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: rows,
    });

    expect(tree.rowMeta?.map((meta) => meta.posInSet)).toStrictEqual([
      1, 1, 2, 2, 1, 1,
    ]);
    expect(tree.rowMeta?.map((meta) => meta.setSize)).toStrictEqual([
      2, 2, 2, 2, 1, 1,
    ]);
  });

  it('marks a leaf as having no children, so it is never announced as expandable', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: rows,
    });

    expect(tree.rowMeta?.map((meta) => meta.hasChildren)).toStrictEqual([
      true,
      false,
      false,
      true,
      true,
      false,
    ]);
  });

  it('still reports a collapsed group as having children it is hiding', () => {
    // Read off the loaded rows rather than the visible ones — a collapsed group
    // whose children are out of sight is exactly the row that must keep
    // announcing `aria-expanded`.
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([resolveGroupPathKey(paris)]),
      data: rows,
    });

    expect(tree.rowMeta?.[0]?.hasChildren).toBe(true);
  });

  it('is unmoved by a collapsed path no row carries', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([
        resolveGroupPathKey([{ columnKey: 'city', label: 'Madrid' }]),
      ]),
      data: rows,
    });

    expect(tree.rows).toHaveLength(rows.length);
  });
});
