import type { TableColumn } from '#ui/components/Table/Table.types';

import type { GroupKeyItem } from '../GroupingSection.types';

type ToGroupKeyItemsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly keys: readonly string[];
};

export const toGroupKeyItems = <TData extends Record<string, unknown>>({
  columns,
  keys,
}: ToGroupKeyItemsArgs<TData>): readonly GroupKeyItem[] =>
  keys.map((columnKey) => ({
    columnKey,
    label:
      columns.find((column) => String(column.key) === columnKey)?.label ??
      columnKey,
  }));
