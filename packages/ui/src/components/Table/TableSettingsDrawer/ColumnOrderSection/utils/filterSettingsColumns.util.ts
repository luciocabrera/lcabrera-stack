import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

/**
 * Filters table columns down to the entries manageable in the column order
 * section: data columns without a custom render, plus static columns (which
 * are always listed, locked in place). Shared by the section header (counts)
 * and body (draggable list).
 *
 * The `render` half is not a capability — carrying a custom cell renderer is
 * not something a column opts out of — so only the `isStatic` half resolves
 * through `resolveColumnCapabilities`, and the compound stays.
 */
export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  columns.filter(
    (col) => !col.render || resolveColumnCapabilities(col).isStatic,
  );
