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
 * over an array, so it always starts `[` and can never be the empty string —
 * including the grand total's, which encodes the empty path as `"[]"` and is
 * therefore still distinct from this.
 */
export const ROOT_PARENT_KEY = '';

/**
 * A group row's depth, 1-based, from its own path.
 *
 * The floor is what the **grand total** needs: a rollup's last row is keyed by
 * nothing, so its path is empty and `path.length` alone would be `0` — not a
 * level at all, and invalid for `aria-level`, which is 1-based (#570).
 *
 * It is clamped to the top level rather than given one of its own because the
 * grand total is a **sibling** of the top-level groups, not their ancestor.
 * Structurally `()` is a prefix of every `(a)` and could be read as their
 * parent, and that reading is rejected: ADR-065 puts its label at depth zero in
 * the hierarchy column — where a top-level group sits — and making it an
 * ancestor would put the entire grid inside one collapsible subtree whose
 * collapse hides the table.
 */
const resolveGroupLevel = (path: readonly TableGroupKeyValue[]) =>
  Math.max(path.length, 1);

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
 * **A group row's ancestry is the prefixes of its own path, and position never
 * contributes to it.** That is what survives rollup, which emits a subtotal
 * *after* the rows it totals and the grand total last of all (#570): the row
 * order changes, the prefixes do not.
 *
 * A **detail** row has no path of its own, so the only thing that can say which
 * group it belongs to is position: it takes the nearest group row above it.
 * That is the one ordering assumption left here. Rollup cannot reach it — a
 * grouped read returns group rows only — and when a slice does interleave
 * detail rows into a grouped result the answer is to give the detail row an
 * explicit parent, not to reorder the query, whose order #570 fixes.
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
    const level = resolveGroupLevel(path);
    const pathKey = resolveGroupPathKey(path);
    const isVisible = !getHasCollapsedAncestor({ collapsedGroupPaths, path });

    nodes.push({
      isVisible,
      level,
      // Read off `path`, not off the clamped `level`, and `<= 1` rather than
      // `=== 1`: an empty path has no proper ancestor, and the prefix branch
      // would hand it `resolveGroupPathKey([])` — its own path key — making the
      // grand total its own parent. Asking the path keeps the two conditions
      // independent, so each is separately falsifiable.
      parentKey:
        path.length <= 1
          ? ROOT_PARENT_KEY
          : resolveGroupPathKey(path.slice(0, -1)),
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
