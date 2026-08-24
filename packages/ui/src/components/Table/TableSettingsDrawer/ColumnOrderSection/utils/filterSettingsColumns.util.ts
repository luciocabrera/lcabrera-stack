import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

/**
 * **Nothing is excluded for being grouped** (ADR-080).
 * Filtering it out here would take the row away in the one configuration where a user most
 * wants to see which columns the grouping is holding.
 */
export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  columns.filter(
    (col) => !col.render || resolveColumnCapabilities(col).isStatic,
  );
