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
 *
 * **Nothing is excluded for being grouped** (ADR-080). The synthetic hierarchy
 * column this used to filter out no longer exists, and a group key is one of
 * the consumer's own columns: it stays listed and is locked in its row instead,
 * by `createDraggableItems`. Filtering it out here would take the row away in
 * the one configuration where a user most wants to see which columns the
 * grouping is holding.
 */
export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  columns.filter(
    (col) => !col.render || resolveColumnCapabilities(col).isStatic,
  );
