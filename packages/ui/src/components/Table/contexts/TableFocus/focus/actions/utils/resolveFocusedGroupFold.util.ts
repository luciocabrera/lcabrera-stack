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
 * **A key column answers for itself and never falls back**, which is the whole
 * of the agreement. A key cell that deliberately draws no control — an open
 * subtotal in the level it totals — must not fold from the keyboard either;
 * falling back to the row there would collapse the group from the one cell whose
 * blank space says it cannot. The group stays reachable, because the row that
 * *does* draw the chevron is in the same column one block up, and the subtotal
 * regains it the moment the group folds.
 *
 * The innermost key column of a **drillable** leaf is the exception, and it is
 * the drill rather than a fold: it opens rows that are not loaded, so it has no
 * level entry by construction (ADR-079).
 *
 * A column that is not a key column falls back to the row, which keeps the
 * treegrid pattern's row-scoped `ArrowLeft`/`ArrowRight` everywhere the question
 * of *which* level could not arise (ADR-062, ADR-067).
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

  const fromRow = {
    hasChildren: meta?.hasChildren ?? false,
    isDrillable: meta?.isDrillable ?? false,
    isExpanded: meta?.isExpanded ?? false,
    path: groupPath,
  };

  const isKeyColumn =
    columnKey !== undefined &&
    groupPath?.some((entry) => entry.columnKey === columnKey) === true;

  if (!isKeyColumn) return fromRow;

  const isInnermost = groupPath?.at(-1)?.columnKey === columnKey;

  return isInnermost && fromRow.isDrillable
    ? fromRow
    : { ...fromRow, hasChildren: false, isDrillable: false };
};
