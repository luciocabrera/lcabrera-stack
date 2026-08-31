import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
} from '../Table.types';

import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';

type WithGroupedColumnLayoutArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

export const withGroupedColumnLayout = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithGroupedColumnLayoutArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  if (groupingKeys.length === 0) return unchanged;

  const keys = resolveDeclaredGroupingKeys({ columns, groupingKeys });

  if (keys.length === 0) return unchanged;

  const groupKeySet = new Set(keys);
  const hoisted = keys as readonly DataKey<TData>[];
  const withoutKeys = (list: readonly DataKey<TData>[]) =>
    list.filter((key) => !groupKeySet.has(String(key)));

  const hiddenKeys = [...columnVisibility].filter((key) =>
    groupKeySet.has(String(key)),
  );

  return {
    columnOrder: [...hoisted, ...withoutKeys(columnOrder)],
    columnPinning: {
      left: [...hoisted, ...withoutKeys(columnPinning.left)],
      right: withoutKeys(columnPinning.right),
    },
    columns,
    columnVisibility:
      hiddenKeys.length === 0
        ? columnVisibility
        : new Set(
            [...columnVisibility].filter(
              (key) => !groupKeySet.has(String(key)),
            ),
          ),
  };
};
