import { describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableGroupDrill,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

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

/** A rollup row: the same shape, totalling the levels beneath it (#570). */
const subtotalRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: { aggregates: [], count: 4, isSubtotal: true, path },
});

const paris = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin', value: 'Berlin' }];
const berlinOpen = [
  { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
  { columnKey: 'status', label: 'Open', value: 'Open' },
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

const drilled = (rowsIn: readonly Row[]) =>
  resolveTableGroupTree({
    canDrill: true,
    collapsedGroupPaths: noneCollapsed,
    data: rowsIn,
    groupingKeys: ['city', 'status'],
  });

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

  it('builds no summaries array for an ungrouped table', () => {
    // Counting element *reads* cannot see this — a predicate walk and a `map`
    // each read every index exactly once, so a read-counting probe passes on
    // both (checked, before this one replaced it). What separates them is that
    // one allocates an N-length array to throw away, and the observable trace
    // of that is which method is called on `data` at all.
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

  it('reads a rollup, whose parents follow their children and end at a grand total', () => {
    // The shape #570 emits, and the one an adjacency walk gets wrong in three
    // separate places. `[EMEA, Spain]` and `[EMEA, France]` are leaves; `[EMEA]`
    // is their parent *and* is emitted after them; `[]` is the grand total,
    // keyed by nothing.
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

    // Ancestry from the path, so a parent emitted last is still a parent.
    expect(tree.rowMeta?.map((meta) => meta.level)).toStrictEqual([2, 2, 1, 1]);
    // The grand total is a *sibling* of the top-level groups, not their
    // ancestor: read as an ancestor it would put the whole grid inside one
    // collapsible subtree. Three roots would be wrong too — `[EMEA]` and `[]`
    // are the only two rows at the top level.
    expect(tree.rowMeta?.map((meta) => meta.setSize)).toStrictEqual([
      2, 2, 2, 2,
    ]);
    expect(tree.rowMeta?.map((meta) => meta.posInSet)).toStrictEqual([
      1, 2, 1, 2,
    ]);
    // And `[EMEA]` owns the two rows above it, so it can be folded. An
    // adjacency test answers `false` here — the next row is shallower, not
    // deeper — and withholds `aria-expanded` from the one row a reader most
    // wants to close.
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

    // Its child goes, it stays, and it still reports the child it is hiding.
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

  describe('drillability', () => {
    it('reports a leaf group drillable and its subtotal not', () => {
      // The pair is disjoint, and that is the whole point of carrying both. In
      // a rollup the row owning loaded children is the subtotal — precisely the
      // row that may not drill — while the leaf that may drill owns nothing
      // loaded. Reading one off the other puts the affordance on the wrong rows
      // in both directions (ADR-079).
      // No detail rows beneath the leaf, which is the shape a drill exists for:
      // the group states a count and holds none of those rows in memory.
      const { rowMeta } = drilled([groupRow(berlinOpen), subtotalRow(berlin)]);

      expect(rowMeta?.[0]).toMatchObject({
        hasChildren: false,
        isDrillable: true,
      });
      expect(rowMeta?.[1]).toMatchObject({
        hasChildren: true,
        isDrillable: false,
      });
    });

    it('refuses an incomplete path, whose children are group rows in memory', () => {
      const { rowMeta } = drilled([groupRow(berlin), groupRow(berlinOpen)]);

      expect(rowMeta?.[0]?.isDrillable).toBe(false);
      expect(rowMeta?.[1]?.isDrillable).toBe(true);
    });

    it('reports nothing drillable when the route serves no drilled page', () => {
      const { rowMeta } = resolveTableGroupTree({
        collapsedGroupPaths: noneCollapsed,
        data: [groupRow(berlinOpen)],
        groupingKeys: ['city', 'status'],
      });

      expect(rowMeta?.[0]?.isDrillable).toBe(false);
    });

    it('leaves a detail row undrillable', () => {
      const { rowMeta } = drilled([groupRow(berlinOpen), { id: 3 }]);

      expect(rowMeta?.[1]?.isDrillable).toBe(false);
    });
  });

  describe('splicing a drilled page', () => {
    const leafKey = resolveGroupPathKey(berlinOpen);
    const spliced = ({
      collapsed = noneCollapsed,
      drill,
    }: {
      readonly collapsed?: ReadonlySet<string>;
      readonly drill: TableGroupDrill;
    }) =>
      resolveTableGroupTree({
        canDrill: true,
        collapsedGroupPaths: collapsed,
        data: [groupRow(berlinOpen), subtotalRow(berlin)],
        drilledGroups: new Map([[leafKey, drill]]),
        groupingKeys: ['city', 'status'],
      });

    it('keeps rows and rowMeta the same length in every fetch state', () => {
      // The identity `TableBody` sizes `<tbody>` from is over `rows.length`, and
      // the focus model indexes both arrays by the same number — so a splice
      // that fed one and not the other would desynchronise the declared height
      // from what is painted, silently.
      for (const drill of [
        { rows: [], status: 'loading' },
        { rows: [], status: 'failed' },
        { rows: [{ id: 3 }], status: 'loaded' },
      ] satisfies TableGroupDrill[]) {
        const { rowMeta, rows } = spliced({ drill });

        expect(rows).toHaveLength(rowMeta?.length ?? -1);
      }
    });

    it('puts the page directly under its group, one level deeper', () => {
      const { rowMeta, rows } = spliced({
        drill: { rows: [{ id: 3 }, { id: 4 }], status: 'loaded' },
      });

      expect(rows).toHaveLength(4);
      expect(rows[1]).toStrictEqual({ id: 3 });
      expect(rowMeta?.[1]?.level).toBe((rowMeta?.[0]?.level ?? 0) + 1);
    });

    it('reports a drillable leaf collapsed until something is asked for', () => {
      // Its collapsed-set membership says nothing on its own: an untouched group
      // is not in that set, so reading expansion from it alone would report
      // every leaf open with nothing under it.
      const { rowMeta } = resolveTableGroupTree({
        canDrill: true,
        collapsedGroupPaths: noneCollapsed,
        data: [groupRow(berlinOpen)],
        groupingKeys: ['city', 'status'],
      });

      expect(rowMeta?.[0]).toMatchObject({
        isDrillable: true,
        isExpanded: false,
      });
    });

    it('reports it expanded once a page has been asked for', () => {
      expect(
        spliced({ drill: { rows: [{ id: 3 }], status: 'loaded' } })
          .rowMeta?.[0],
      ).toMatchObject({ isExpanded: true });
    });

    it('hides a drilled page while its group is collapsed', () => {
      const { rows } = spliced({
        collapsed: new Set([leafKey]),
        drill: { rows: [{ id: 3 }], status: 'loaded' },
      });

      expect(rows).toHaveLength(2);
    });

    it('splices nothing when the route serves no drilled page', () => {
      const { rows } = resolveTableGroupTree({
        collapsedGroupPaths: noneCollapsed,
        data: [groupRow(berlinOpen), subtotalRow(berlin)],
        drilledGroups: new Map([
          [leafKey, { rows: [{ id: 3 }], status: 'loaded' }],
        ]),
        groupingKeys: ['city', 'status'],
      });

      expect(rows).toHaveLength(2);
    });
  });
});
