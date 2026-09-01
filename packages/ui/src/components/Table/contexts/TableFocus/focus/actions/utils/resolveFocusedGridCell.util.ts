import type {
  TableFocusState,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

type FocusedGridCell = {
  readonly columnIndex: number;
  readonly groupPath: readonly TableGroupKeyValue[] | undefined;
  readonly hasFocusedCell: boolean;
  readonly meta: TableGroupTreeRowMeta | undefined;
};

type ResolveFocusedGridCellArgs<TData extends Record<string, unknown>> = {
  readonly columnKeys: readonly string[];
  readonly data: readonly TData[];
  readonly focusedRowIndex: number | undefined;
  readonly focusState: TableFocusState;
  readonly rowMeta: readonly TableGroupTreeRowMeta[] | undefined;
};

export const resolveFocusedGridCell = <TData extends Record<string, unknown>>({
  columnKeys,
  data,
  focusedRowIndex,
  focusState,
  rowMeta,
}: ResolveFocusedGridCellArgs<TData>): FocusedGridCell => {
  const columnIndex =
    focusState.columnKey === undefined
      ? -1
      : columnKeys.indexOf(focusState.columnKey);

  if (focusedRowIndex === undefined) {
    return {
      columnIndex,
      groupPath: undefined,
      hasFocusedCell: false,
      meta: undefined,
    };
  }

  const row = data[focusedRowIndex];

  return {
    columnIndex,
    groupPath:
      row === undefined ? undefined : getTableGroupRowSummary(row)?.path,
    hasFocusedCell: columnIndex >= 0,
    meta: rowMeta?.[focusedRowIndex],
  };
};
