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

type VisibleRow<TData> = {
  /** Read from the **loaded** rows, so a collapsed group still reports the children it hides. */
  readonly hasChildren: boolean;
  readonly node: GroupTreeNode;
  readonly row: TData;
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
  collapsedGroupPaths,
  data,
}: ResolveTableGroupTreeArgs<TData>) => {
  if (data.every((row) => getTableGroupRowSummary(row) === undefined)) {
    return { isTreeGrid: false, rowMeta: undefined, rows: data };
  }

  const summaries = data.map((row) => getTableGroupRowSummary(row));
  const nodes = resolveGroupTreeNodes({ collapsedGroupPaths, summaries });
  const visible: VisibleRow<TData>[] = [];

  for (const [index, node] of nodes.entries()) {
    const row = data[index];

    if (row === undefined || !node.isVisible) continue;

    visible.push({
      hasChildren: (nodes[index + 1]?.level ?? 0) > node.level,
      node,
      row,
    });
  }

  const setSizes = countSiblings(visible.map(({ node }) => node.parentKey));
  const positions = new Map<string, number>();
  const rowMeta: TableGroupTreeRowMeta[] = [];
  const rows: TData[] = [];

  for (const { hasChildren, node, row } of visible) {
    const posInSet = (positions.get(node.parentKey) ?? 0) + 1;

    positions.set(node.parentKey, posInSet);
    rows.push(row);
    rowMeta.push({
      hasChildren,
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
