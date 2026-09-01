import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

type ResolveFocusedGroupFoldArgs = {
  readonly columnKey: string | undefined;
  readonly groupPath: readonly TableGroupKeyValue[] | undefined;
  readonly meta: TableGroupTreeRowMeta | undefined;
};

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

  return isInnermost ? { ...fromRow, hasChildren: false } : fromRow;
};
