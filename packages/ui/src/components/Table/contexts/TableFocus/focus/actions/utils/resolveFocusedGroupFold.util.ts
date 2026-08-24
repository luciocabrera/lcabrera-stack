import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

type ResolveFocusedGroupFoldArgs = {
  readonly columnKey: string | undefined;
  readonly groupPath: readonly TableGroupKeyValue[] | undefined;
  readonly meta: TableGroupTreeRowMeta | undefined;
};

/**
 * **A key column answers for itself and never falls back**, which is the whole of the
 * agreement.
 * A key cell that deliberately draws no control — an open subtotal in the level it totals
 * — must not fold from the keyboard either; falling back to the row there would collapse
 * the group from the one cell whose blank space says it cannot.
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
