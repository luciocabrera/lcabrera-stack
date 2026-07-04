import type { TableColumn } from '@repo/ui/components/Table/Table.types';

/**
 * Extracts a Set of keys from columns marked as static.
 */
export const getStaticColumnKeys = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  new Set<string>(columns.filter((col) => col.isStatic).map((col) => col.key));
