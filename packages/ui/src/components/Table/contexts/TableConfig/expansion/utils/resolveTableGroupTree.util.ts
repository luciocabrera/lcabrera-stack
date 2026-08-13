import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { resolveGroupTreeNodes } from './resolveGroupTreeNodes.util';

/** One visible row's place in the tree, as ARIA needs it stated. */
export type TableGroupTreeRowMeta = {
  /** Whether the row owns rows below it — what decides if `aria-expanded` applies at all. */
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly level: number;
  /** Present only on a group row; it is the key expansion is stored under. */
  readonly pathKey: string | undefined;
  readonly posInSet: number;
  readonly setSize: number;
};

type ResolveTableGroupTreeArgs<TData> = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly data: readonly TData[];
};

const countSiblings = (nodes: readonly GroupTreeNode[]) => {
  const counts = new Map<string, number>();

  for (const { parentKey } of nodes) {
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
 * reference: an ungrouped grid must not pay a per-row allocation on every
 * scroll frame for a tree it does not have.
 *
 * `isTreeGrid` is asked of the **rows**, not of the grouping configuration, so
 * a grouped read that returned no groups is not announced as a tree with
 * nothing in it.
 *
 * `posInSet`/`setSize` are counted over the visible rows alone. Every sibling of
 * a rendered row is itself rendered — they share a parent, and that parent is
 * expanded or none of them would be here — so the count is the same one the
 * full data would give, without having to say which hidden rows to skip.
 */
export const resolveTableGroupTree = <TData extends Record<string, unknown>>({
  collapsedGroupPaths,
  data,
}: ResolveTableGroupTreeArgs<TData>) => {
  const summaries = data.map((row) => getTableGroupRowSummary(row));

  if (summaries.every((summary) => summary === undefined)) {
    return { isTreeGrid: false, rowMeta: undefined, rows: data };
  }

  const nodes = resolveGroupTreeNodes({ collapsedGroupPaths, summaries });
  const visible = nodes
    .entries()
    .filter(([, node]) => node.isVisible)
    .toArray();
  const setSizes = countSiblings(visible.map(([, node]) => node));
  const positions = new Map<string, number>();
  const rowMeta: TableGroupTreeRowMeta[] = [];
  const rows: TData[] = [];

  for (const [index, node] of visible) {
    const row = data[index];

    if (row === undefined) continue;

    const posInSet = (positions.get(node.parentKey) ?? 0) + 1;

    positions.set(node.parentKey, posInSet);
    rows.push(row);
    rowMeta.push({
      hasChildren: (nodes[index + 1]?.level ?? 0) > node.level,
      isExpanded:
        node.pathKey !== undefined && !collapsedGroupPaths.has(node.pathKey),
      level: node.level,
      pathKey: node.pathKey,
      posInSet,
      setSize: setSizes.get(node.parentKey) ?? 1,
    });
  }

  return { isTreeGrid: true, rowMeta, rows };
};
