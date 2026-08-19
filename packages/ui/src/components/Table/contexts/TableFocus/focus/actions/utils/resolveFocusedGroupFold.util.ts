import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

type ResolveFocusedGroupFoldArgs = {
  /** The focused column, which is what selects between the row's levels. */
  readonly columnKey: string | undefined;
  /** The focused row's own group, when it is a group row. */
  readonly groupPath: readonly TableGroupKeyValue[] | undefined;
  readonly meta: TableGroupTreeRowMeta | undefined;
};

/**
 * Which group `ArrowLeft`/`ArrowRight` act on from the focused cell, and the
 * state that decides which of the two is live.
 *
 * **The focused column selects the level**, so the keyboard folds what the
 * chevron in that same cell folds (#802). Without this the two paths would
 * disagree on every row that states an ancestor: the pointer would fold the
 * level under the cursor while the keyboard folded the row's own group, from a
 * cell that draws a different one.
 *
 * A column with no level of its own falls back to the row — which is every
 * detail row, every non-key column, and a group row's own innermost level where
 * a drill rather than a fold is what it offers (ADR-079).
 */
export const resolveFocusedGroupFold = ({
  columnKey,
  groupPath,
  meta,
}: ResolveFocusedGroupFoldArgs) => {
  const level =
    columnKey === undefined
      ? undefined
      : meta?.levelDisclosures.find((entry) => entry.columnKey === columnKey);

  if (level !== undefined)
    return {
      hasChildren: true,
      isDrillable: false,
      isExpanded: level.isExpanded,
      path: level.path,
    };

  return {
    hasChildren: meta?.hasChildren ?? false,
    isDrillable: meta?.isDrillable ?? false,
    isExpanded: meta?.isExpanded ?? false,
    path: groupPath,
  };
};
