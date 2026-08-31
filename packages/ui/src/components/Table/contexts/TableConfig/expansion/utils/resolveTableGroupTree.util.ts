import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { TableGroupLevelDisclosure } from './resolveGroupLevelDisclosures.util';
import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { collectFoldableGroupPaths } from './collectFoldableGroupPaths.util';
import { resolveGroupLevelDisclosures } from './resolveGroupLevelDisclosures.util';
import { resolveGroupTreeNodes } from './resolveGroupTreeNodes.util';

export type TableGroupTreeRowMeta = {
  /** Decides whether `aria-expanded` applies at all. */
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly level: number;
  readonly levelDisclosures: readonly TableGroupLevelDisclosure[];
  readonly pathKey: string | undefined;
  readonly posInSet: number;
  readonly setSize: number;
};

type ResolveTableGroupTreeArgs<TData> = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly data: readonly TData[];
};

type VisibleRow<TData> = {
  readonly hasChildren: boolean;
  readonly node: GroupTreeNode;
  readonly row: TData;
  readonly summary: TableGroupRowSummary | undefined;
};

const NO_FOLDABLE_GROUP_PATHS: ReadonlySet<string> = new Set<string>();

const countSiblings = (parentKeys: readonly string[]) => {
  const counts = new Map<string, number>();

  for (const parentKey of parentKeys) {
    counts.set(parentKey, (counts.get(parentKey) ?? 0) + 1);
  }

  return counts;
};

export const resolveTableGroupTree = <TData extends Record<string, unknown>>({
  collapsedGroupPaths,
  data,
}: ResolveTableGroupTreeArgs<TData>) => {
  if (data.every((row) => getTableGroupRowSummary(row) === undefined)) {
    return {
      foldableGroupPaths: NO_FOLDABLE_GROUP_PATHS,
      isTreeGrid: false,
      rowMeta: undefined,
      rows: data,
    };
  }

  const summaries = data.map((row) => getTableGroupRowSummary(row));
  const nodes = resolveGroupTreeNodes({ collapsedGroupPaths, summaries });
  const foldableGroupPaths = collectFoldableGroupPaths(nodes);
  const visible: VisibleRow<TData>[] = [];

  for (const [index, node] of nodes.entries()) {
    const row = data[index];

    if (row === undefined || !node.isVisible) continue;

    visible.push({
      hasChildren:
        node.pathKey !== undefined && foldableGroupPaths.has(node.pathKey),
      node,
      row,
      summary: summaries[index],
    });
  }

  const setSizes = countSiblings(visible.map(({ node }) => node.parentKey));
  const positions = new Map<string, number>();
  const rowMeta: TableGroupTreeRowMeta[] = [];
  const rows: TData[] = [];

  for (const { hasChildren, node, row, summary } of visible) {
    const posInSet = (positions.get(node.parentKey) ?? 0) + 1;
    const isCollapsed =
      node.pathKey !== undefined && collapsedGroupPaths.has(node.pathKey);

    positions.set(node.parentKey, posInSet);
    rows.push(row);
    rowMeta.push({
      hasChildren,
      isExpanded: !isCollapsed && node.pathKey !== undefined,
      level: node.level,
      levelDisclosures: resolveGroupLevelDisclosures({
        collapsedGroupPaths,
        foldableKeys: foldableGroupPaths,
        pathKey: node.pathKey,
        summary,
      }),
      pathKey: node.pathKey,
      posInSet,
      setSize: setSizes.get(node.parentKey) ?? 1,
    });
  }

  return { foldableGroupPaths, isTreeGrid: true, rowMeta, rows };
};
