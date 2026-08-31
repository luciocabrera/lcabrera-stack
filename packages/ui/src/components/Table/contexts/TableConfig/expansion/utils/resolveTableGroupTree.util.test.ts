import { describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import { resolveTableGroupTree } from './resolveTableGroupTree.util';

type Row = Record<string, unknown>;

const groupRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 2,
    isSubtotal: false,
    path,
  },
});

const subtotalRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 4, isSubtotal: true, path },
});

const paris = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin', value: 'Berlin' }];
const berlinOpen = [
  { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
  { columnKey: 'status', label: 'Open', value: 'Open' },
];

const rows: readonly Row[] = [
  groupRow(paris),
  { id: 1 },
  { id: 2 },
  groupRow(berlin),
  groupRow(berlinOpen),
  { id: 3 },
];

const noneCollapsed = new Set<string>();

const tree = (rowsIn: readonly Row[]) =>
  resolveTableGroupTree({
    collapsedGroupPaths: noneCollapsed,
    data: rowsIn,
  });

describe('resolveTableGroupTree', () => {
  it('returns the caller data by reference when the rows are not a tree', () => {
    const flat: readonly Row[] = [{ id: 1 }, { id: 2 }];
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: flat,
    });

    expect(tree.isTreeGrid).toBe(false);
    expect(tree.rows).toBe(flat);
    expect(tree.rowMeta).toBeUndefined();
  });

  it('builds no summaries array for an ungrouped table', () => {
    const watched: Row[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const everySpy = vi.spyOn(watched, 'every');
    const mapSpy = vi.spyOn(watched, 'map');

    resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: watched,
    });

    expect(everySpy).toHaveBeenCalledTimes(1);
    expect(mapSpy).not.toHaveBeenCalled();
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

    expect(tree.rows).toHaveLength(4);
    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([1, 1, 2, 3]);
    expect(tree.rowMeta?.[0]?.isExpanded).toBe(false);
    expect(tree.rowMeta?.[1]?.isExpanded).toBe(true);
  });

  it('hides a nested group and its rows when the ancestor closes', () => {
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
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([resolveGroupPathKey(paris)]),
      data: rows,
    });

    expect(tree.rowMeta?.[0]?.hasChildren).toBe(true);
  });

  it('reads a rollup, whose parents follow their children and end at a grand total', () => {
    const emea = [{ columnKey: 'region', label: 'EMEA', value: 'EMEA' }];
    const spain = [
      ...emea,
      { columnKey: 'country', label: 'Spain', value: 'Spain' },
    ];
    const france = [
      ...emea,
      { columnKey: 'country', label: 'France', value: 'France' },
    ];

    const tree = resolveTableGroupTree({
      collapsedGroupPaths: noneCollapsed,
      data: [
        groupRow(spain),
        groupRow(france),
        subtotalRow(emea),
        subtotalRow([]),
      ],
    });

    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([2, 2, 1, 1]);
    expect(tree.rowMeta?.map((meta) => meta.setSize)).toStrictEqual([
      2, 2, 2, 2,
    ]);
    expect(tree.rowMeta?.map((meta) => meta.posInSet)).toStrictEqual([
      1, 2, 1, 2,
    ]);
    expect(tree.rowMeta?.map((meta) => meta.hasChildren)).toStrictEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  it('folds a rollup parent that sits below the rows it totals', () => {
    const emea = [{ columnKey: 'region', label: 'EMEA', value: 'EMEA' }];
    const spain = [
      ...emea,
      { columnKey: 'country', label: 'Spain', value: 'Spain' },
    ];

    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([resolveGroupPathKey(emea)]),
      data: [groupRow(spain), subtotalRow(emea), subtotalRow([])],
    });

    expect(tree.rows).toHaveLength(2);
    expect(tree.rowMeta?.[0]?.hasChildren).toBe(true);
    expect(tree.rowMeta?.[0]?.isExpanded).toBe(false);
  });

  it('is unmoved by a collapsed path no row carries', () => {
    const tree = resolveTableGroupTree({
      collapsedGroupPaths: new Set([
        resolveGroupPathKey([
          { columnKey: 'city', label: 'Madrid', value: 'Madrid' },
        ]),
      ]),
      data: rows,
    });

    expect(tree.rows).toHaveLength(rows.length);
  });

  describe('the foldable set', () => {
    it('publishes every group that owns rows and renders one, and nothing else', () => {
      const { foldableGroupPaths } = tree(rows);

      expect(foldableGroupPaths.size).toBe(3);
      expect(foldableGroupPaths.has(resolveGroupPathKey(paris))).toBe(true);
      expect(foldableGroupPaths.has(resolveGroupPathKey(berlin))).toBe(true);
      expect(foldableGroupPaths.has(resolveGroupPathKey(berlinOpen))).toBe(
        true,
      );
    });

    it('keeps a group row standing through its own collapse', () => {
      const parisKey = resolveGroupPathKey(paris);
      const { foldableGroupPaths } = tree(rows);

      expect(foldableGroupPaths.has(parisKey)).toBe(true);

      const { rows: standing } = resolveTableGroupTree({
        collapsedGroupPaths: foldableGroupPaths,
        data: rows,
      });

      expect(
        standing.map((row) => getTableGroupRowSummary(row)?.path),
      ).toStrictEqual([paris, berlin]);
    });

    it('is empty on a grid with no group rows in it', () => {
      expect([...tree([{ id: 1 }]).foldableGroupPaths]).toStrictEqual([]);
    });

    it('offers no fold under `flat`, where no ancestor has a row of its own', () => {
      const flat = [
        groupRow(berlinOpen),
        groupRow([
          { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
          { columnKey: 'status', label: 'Shut', value: 'Shut' },
        ]),
      ];
      const { foldableGroupPaths, rowMeta } = tree(flat);

      expect([...foldableGroupPaths]).toStrictEqual([]);
      expect(
        rowMeta?.map(({ levelDisclosures }) => levelDisclosures),
      ).toStrictEqual([[], []]);
    });

    it('offers the same path under rollup, where the subtotal survives the fold', () => {
      const rollup = [groupRow(berlinOpen), subtotalRow(berlin)];
      const { foldableGroupPaths, rowMeta } = tree(rollup);

      expect([...foldableGroupPaths]).toStrictEqual([
        resolveGroupPathKey(berlin),
      ]);
      expect(
        rowMeta?.[0]?.levelDisclosures.map(({ columnKey }) => columnKey),
      ).toStrictEqual(['city']);
    });
  });
});
