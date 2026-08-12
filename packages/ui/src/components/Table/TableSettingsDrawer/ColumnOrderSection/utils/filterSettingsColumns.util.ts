import type { TableColumn } from '#ui/components/Table/Table.types';

/**
 * Filters table columns down to the entries manageable in the column order
 * section: data columns without a custom render, plus static columns (which
 * are always listed, locked in place). Shared by the section header (counts)
 * and body (draggable list).
 */
export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) => columns.filter((col) => !col.render || col.isStatic);
