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
 * A row's own innermost key column has no level entry by construction: the row
 * *is* that level, so there is nothing under it to fold. It carries the link to
 * the group's rows instead (ADR-087).
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
      isExpanded: level.isExpanded,
      path: level.path,
    };

  const fromRow = {
    hasChildren: meta?.hasChildren ?? false,
    isExpanded: meta?.isExpanded ?? false,
    path: groupPath,
  };

  const isKeyColumn =
    columnKey !== undefined &&
    groupPath?.some((entry) => entry.columnKey === columnKey) === true;

  if (!isKeyColumn) return fromRow;

  const isInnermost = groupPath?.at(-1)?.columnKey === columnKey;

  // A key cell folds the level it names and nothing else, so the innermost one
  // — the level the row *is* — has nothing under it to fold (#870).
  return isInnermost ? { ...fromRow, hasChildren: false } : fromRow;
};
