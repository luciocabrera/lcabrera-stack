import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

export type GroupTreeNode = {
  readonly isVisible: boolean;
  readonly level: number;
  readonly parentKey: string;
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
 * A path key is `JSON.stringify` over an array, so it always starts `[` and can never be
 * the empty string — including the grand total's, which encodes the empty path as `"[]"`
 * and is therefore still distinct from this.
 */
export const ROOT_PARENT_KEY = '';

/**
 * The floor is what the **grand total** needs: a rollup's last row is keyed by nothing, so
 * its path is empty and `path.length` alone would be `0` — not a level at all, and invalid
 * for `aria-level`, which is 1-based (#570).
 * Structurally `()` is a prefix of every `(a)` and could be read as their parent, and that
 * reading is rejected: ADR-065 puts its label at depth zero in the hierarchy column —
 * where a top-level group sits — and making it an ancestor would put the entire grid
 * inside one collapsible subtree whose collapse hides the table.
 */
const resolveGroupLevel = (path: readonly TableGroupKeyValue[]) =>
  Math.max(path.length, 1);

/**
 * Whether any proper prefix of this group's path is collapsed — its ancestors, read off
 * the path rather than off where the row happens to sit.
 * Every grouping set either mode emits is a prefix of the key list, so a row's ancestors
 * **are** the prefixes of its own path (ADR-065).
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
 * **A group row's ancestry is the prefixes of its own path, and position never contributes
 * to it.** That is what survives rollup, which emits a subtotal *after* the rows it totals
 * and the grand total last of all (#570): the row order changes, the prefixes do not.
 * Rollup cannot reach it — a grouped read returns group rows only — and when a slice does
 * interleave detail rows into a grouped result the answer is to give the detail row an
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
