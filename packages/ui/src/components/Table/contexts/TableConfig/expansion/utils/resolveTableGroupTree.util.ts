import type {
  TableGroupDrill,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { TableGroupLevelDisclosure } from './resolveGroupLevelDisclosures.util';
import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { isDrillableGroupRow } from './isDrillableGroupRow.util';
import { resolveDrilledBlock } from './resolveDrilledBlock.util';
import { resolveGroupLevelDisclosures } from './resolveGroupLevelDisclosures.util';
import { resolveGroupRowIsExpanded } from './resolveGroupRowIsExpanded.util';
import { resolveGroupTreeNodes } from './resolveGroupTreeNodes.util';

/** One visible row's place in the tree, as ARIA needs it stated. */
export type TableGroupTreeRowMeta = {
  /**
   * Whether the row owns rows below it — what decides if `aria-expanded`
   * applies at all.
   *
   * **Loaded rows only.** A leaf group owns rows in the table and none of them
   * in memory, so this is `false` for exactly the rows a drill exists to fetch
   * — see `isDrillable`, which is the other half of the answer.
   */
  readonly hasChildren: boolean;
  /**
   * Whether the row can fetch its own rows (ADR-079).
   *
   * Disjoint from `hasChildren` in practice, and the pair is why both exist: in
   * a rollup the only row owning loaded children is the **subtotal**, which is
   * precisely the row that may not drill, while the leaf that may drill owns
   * nothing loaded. Collapsing one truth into the other would put the
   * affordance on the wrong rows in both directions.
   */
  readonly isDrillable: boolean;
  readonly isExpanded: boolean;
  readonly level: number;
  /**
   * The groups this row can fold, each keyed by the column stating its level
   * (#802). A row folds its ancestors, so this is empty on a detail row and on
   * a group row every one of whose levels is either childless or its own open
   * group — see `resolveGroupLevelDisclosures`.
   */
  readonly levelDisclosures: readonly TableGroupLevelDisclosure[];
  /** Present only on a group row; it is the key expansion is stored under. */
  readonly pathKey: string | undefined;
  readonly posInSet: number;
  readonly setSize: number;
};

type ResolveTableGroupTreeArgs<TData> = {
  /** Whether the route serves a drilled page at all (ADR-063). Off by default. */
  readonly canDrill?: boolean;
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly data: readonly TData[];
  /** Per-group drilled pages and fetch state. Absent means nothing is drilled. */
  readonly drilledGroups?: ReadonlyMap<string, TableGroupDrill>;
  /** The applied group keys — what a complete path is measured against. */
  readonly groupingKeys?: readonly string[];
};

type VisibleRow<TData> = {
  /** Read from the **loaded** rows, so a collapsed group still reports the children it hides. */
  readonly hasChildren: boolean;
  readonly isDrillable: boolean;
  readonly node: GroupTreeNode;
  readonly row: TData;
  readonly summary: TableGroupRowSummary | undefined;
};

/**
 * The path keys that some other row calls its parent — i.e. every group row
 * that owns something.
 *
 * Read off the **tree**, not off adjacency. The obvious walk asks whether the
 * *next* row is deeper, and that answer is only right while a parent precedes
 * its children: rollup emits a subtotal **after** the rows it totals (#570), so
 * an adjacency test reports every subtotal as childless, withholds
 * `aria-expanded` from it, and leaves the one row a user most wants to fold
 * unfoldable.
 *
 * Built over the **loaded** nodes rather than the visible ones, so a collapsed
 * group still reports the children it is hiding — which is what keeps its
 * `aria-expanded` present and `false` rather than disappearing on collapse.
 */
const collectParentKeys = (nodes: readonly GroupTreeNode[]) => {
  const parentKeys = new Set<string>();

  for (const node of nodes) parentKeys.add(node.parentKey);

  return parentKeys;
};

const countSiblings = (parentKeys: readonly string[]) => {
  const counts = new Map<string, number>();

  for (const parentKey of parentKeys) {
    counts.set(parentKey, (counts.get(parentKey) ?? 0) + 1);
  }

  return counts;
};

/**
 * The rows a grouped grid actually paints, and what each of them is in the
 * tree.
 *
 * Collapsing filters an array that is already in memory — a grouped read
 * returns whole (ADR-059), so no fetch is involved and the only thing that
 * changes is the index space the virtualizer windows over. That is why every
 * index downstream of this — the focus store's `rowIndex`, `aria-rowindex` —
 * counts **visible** rows and not loaded ones (ADR-067).
 *
 * A table with no group rows short-circuits to its own `data` array, by
 * reference. The check is an `every` rather than a `map`, and that is the whole
 * of what makes the sentence above true: an ungrouped grid re-derives this on
 * every scroll frame, so it walks the rows and allocates **nothing**, while a
 * grouped one stops at its first group row and pays for the summaries once.
 *
 * `isTreeGrid` is asked of the **rows**, not of the grouping configuration, so
 * a grouped read that returned no groups is not announced as a tree with
 * nothing in it.
 *
 * No iterator helper appears below. `@lcabrera/ui` ships source rather than a
 * build, so a consumer compiles this file with their own toolchain — and
 * `Iterator.prototype.filter`/`toArray` are runtime **methods**, which a
 * downlevel target emits verbatim instead of rewriting. Iterating
 * `array.entries()` with `for...of` is ordinary ES2015 and carries none of
 * that.
 *
 * `posInSet`/`setSize` are counted over the visible rows alone. Every sibling of
 * a rendered row is itself rendered — they share a parent, and that parent is
 * expanded or none of them would be here — so the count is the same one the
 * full data would give, without having to say which hidden rows to skip.
 */
export const resolveTableGroupTree = <TData extends Record<string, unknown>>({
  canDrill = false,
  collapsedGroupPaths,
  data,
  drilledGroups,
  groupingKeys = [],
}: ResolveTableGroupTreeArgs<TData>) => {
  if (data.every((row) => getTableGroupRowSummary(row) === undefined)) {
    return { isTreeGrid: false, rowMeta: undefined, rows: data };
  }

  const summaries = data.map((row) => getTableGroupRowSummary(row));
  const nodes = resolveGroupTreeNodes({ collapsedGroupPaths, summaries });
  const parentKeys = collectParentKeys(nodes);
  const visible: VisibleRow<TData>[] = [];

  for (const [index, node] of nodes.entries()) {
    const row = data[index];

    if (row === undefined || !node.isVisible) continue;

    visible.push({
      hasChildren: node.pathKey !== undefined && parentKeys.has(node.pathKey),
      isDrillable: isDrillableGroupRow({
        canDrill,
        groupingKeys,
        summary: summaries[index],
      }),
      node,
      row,
      summary: summaries[index],
    });
  }

  const setSizes = countSiblings(visible.map(({ node }) => node.parentKey));
  const positions = new Map<string, number>();
  const rowMeta: TableGroupTreeRowMeta[] = [];
  const rows: TData[] = [];

  for (const { hasChildren, isDrillable, node, row, summary } of visible) {
    const posInSet = (positions.get(node.parentKey) ?? 0) + 1;
    const drill =
      node.pathKey === undefined ? undefined : drilledGroups?.get(node.pathKey);
    const isCollapsed =
      node.pathKey !== undefined && collapsedGroupPaths.has(node.pathKey);

    positions.set(node.parentKey, posInSet);
    rows.push(row);
    rowMeta.push({
      hasChildren,
      isDrillable,
      isExpanded: resolveGroupRowIsExpanded({
        drill,
        isCollapsed,
        isDrillable,
        pathKey: node.pathKey,
      }),
      level: node.level,
      levelDisclosures: resolveGroupLevelDisclosures({
        collapsedGroupPaths,
        parentKeys,
        pathKey: node.pathKey,
        summary,
      }),
      pathKey: node.pathKey,
      posInSet,
      setSize: setSizes.get(node.parentKey) ?? 1,
    });

    // Spliced in the same iteration that pushed the group row, so `rows` and
    // `rowMeta` cannot fall out of step — the identity `TableBody` sizes
    // `<tbody>` from is over `rows.length`, and the focus model indexes both by
    // the same number. `resolveDrilledBlock` pairs each row with its meta for
    // the same reason, one level down.
    const drilledBlock = resolveDrilledBlock({
      drill,
      isCollapsed,
      isDrillable,
      level: node.level,
      pathKey: node.pathKey,
      row,
    });

    for (const entry of drilledBlock) {
      rows.push(entry.row as TData);
      rowMeta.push(entry.meta);
    }
  }

  return { isTreeGrid: true, rowMeta, rows };
};
