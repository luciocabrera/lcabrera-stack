import type { TableColumn } from '@/components/Table/Table.types';

/**
 * Extracts a Set of keys from columns marked as static.
 */
export const getStaticColumnKeys = <TData>(
  columns: readonly TableColumn<TData>[],
): Set<string> =>
  new Set<string>(
    columns.filter((col) => col.isStatic).map((col) => col.key),
  );
