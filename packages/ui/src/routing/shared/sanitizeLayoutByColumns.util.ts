import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

type SanitizeLayoutByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

export const sanitizeLayoutByColumns = <TData extends Record<string, unknown>>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  sorting,
}: SanitizeLayoutByColumnsArgs<TData>) => {
  const declaredKeys = new Set(columns.map((column) => String(column.key)));

  const keepKeys = (value: unknown) =>
    Array.isArray(value)
      ? value.filter(
          (key): key is string =>
            typeof key === 'string' && declaredKeys.has(key),
        )
      : [];

  const pinning: Record<string, unknown> =
    isObject(columnPinning) && !Array.isArray(columnPinning)
      ? columnPinning
      : {};
  const sizing: Record<string, unknown> =
    isObject(columnSizing) && !Array.isArray(columnSizing) ? columnSizing : {};
  const visibilitySource =
    columnVisibility instanceof Set ? [...columnVisibility] : columnVisibility;

  return {
    columnOrder: keepKeys(columnOrder) as ColumnOrderState<TData>,
    columnPinning: {
      left: keepKeys(pinning.left),
      right: keepKeys(pinning.right),
    } as ColumnPinningState<TData>,
    columnSizing: Object.fromEntries(
      Object.entries(sizing).filter(
        ([key, size]) => declaredKeys.has(key) && typeof size === 'number',
      ),
    ) as ColumnSizingState<TData>,
    columnVisibility: new Set(
      keepKeys(visibilitySource),
    ) as ColumnVisibilityState<TData>,
    sorting: Array.isArray(sorting)
      ? sorting.filter(
          (entry) =>
            isObject(entry) &&
            typeof entry.columnKey === 'string' &&
            declaredKeys.has(String(entry.columnKey)),
        )
      : [],
  };
};
