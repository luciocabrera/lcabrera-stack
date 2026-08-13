import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

export type GroupTreeNode = {
  /** False while an ancestor of this row is collapsed. */
  readonly isVisible: boolean;
  /** 1-based depth: a group's is its path length, a detail row's its group's plus one. */
  readonly level: number;
  /** The path key of the node owning this row, or `ROOT_PARENT_KEY` at the top. */
  readonly parentKey: string;
  /** Present only on a group row — a detail row is a leaf and carries no path. */
  readonly pathKey: string | undefined;
};

type GetHasCollapsedAncestorArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly path: readonly TableGroupKeyValue[];
};

type OpenGroup = {
  readonly isSubtreeHidden: boolean;
  readonly level: number;
  readonly pathKey: string;
};

type ResolveGroupTreeNodesArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly summaries: readonly (TableGroupRowSummary | undefined)[];
};

/**
 * The parent of a row with no group above it. A path key is `JSON.stringify`
 * over a non-empty array, so it can never be the empty string and can never
 * collide with this.
 */
const ROOT_PARENT_KEY = '';

/**
 * Whether any proper prefix of this group's path is collapsed — its ancestors,
 * read off the path rather than off where the row happens to sit.
 *
 * Every grouping set either mode emits is a prefix of the key list, so a row's
 * ancestors **are** the prefixes of its own path (ADR-065). Deriving ancestry
 * that way rather than from a running stack of preceding rows means a group's
 * depth and its parent do not depend on emission order — which is the half of
 * this that rollup's subtotal ordering (#570) must not be able to break.
 */
const getHasCollapsedAncestor = ({
  collapsedGroupPaths,
  path,
}: GetHasCollapsedAncestorArgs) =>
  path
    .slice(0, -1)
    .some((_unused, index) =>
      collapsedGroupPaths.has(resolveGroupPathKey(path.slice(0, index + 1))),
    );

/**
 * Where every loaded row sits in the group tree, and whether a collapse hides
 * it.
 *
 * A **detail** row has no path of its own, so the only thing that can say which
 * group it belongs to is position: it takes the nearest group row above it.
 * That is the one ordering assumption here, and it is the order a grouped read
 * emits today — a result putting its subtotals *after* their children would
 * need this half inverted. Group rows are unaffected either way, because their
 * ancestry comes from their own path.
 */
export const resolveGroupTreeNodes = ({
  collapsedGroupPaths,
  summaries,
}: ResolveGroupTreeNodesArgs): readonly GroupTreeNode[] => {
  const nodes: GroupTreeNode[] = [];
  let openGroup: OpenGroup | undefined;

  for (const summary of summaries) {
    if (summary === undefined) {
      nodes.push({
        isVisible: !(openGroup?.isSubtreeHidden ?? false),
        level: (openGroup?.level ?? 0) + 1,
        parentKey: openGroup?.pathKey ?? ROOT_PARENT_KEY,
        pathKey: undefined,
      });
      continue;
    }

    const { path } = summary;
    const level = path.length;
    const pathKey = resolveGroupPathKey(path);
    const isVisible = !getHasCollapsedAncestor({ collapsedGroupPaths, path });

    nodes.push({
      isVisible,
      level,
      parentKey:
        level === 1 ? ROOT_PARENT_KEY : resolveGroupPathKey(path.slice(0, -1)),
      pathKey,
    });
    openGroup = {
      isSubtreeHidden: !isVisible || collapsedGroupPaths.has(pathKey),
      level,
      pathKey,
    };
  }

  return nodes;
};
