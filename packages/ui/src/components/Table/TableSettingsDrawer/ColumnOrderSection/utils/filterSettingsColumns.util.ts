import type { TableColumn } from '#ui/components/Table/Table.types';

import { isTableGroupHierarchyColumn } from '#ui/components/Table/utils/isTableGroupHierarchyColumn.util';
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
 * **The hierarchy column is excluded explicitly** (ADR-065). It is static, so
 * the `isStatic` arm above would list it — locked in place, but listed — and it
 * is not one of the consumer's columns at all: there is nothing a user can do
 * to it, so a drawer row for it is a row that answers nothing. The exclusion is
 * written here because this is the one place the draggable list and the header
 * count agree on. It is deliberately not conditional on how the column reached
 * a caller's list: today it is injected into the derived view state only, so a
 * list drawn from the columns store never carries it — and this is what keeps
 * that true if a later slice puts it in the store.
 */
export const filterSettingsColumns = <TData>(
  columns: readonly TableColumn<TData>[],
) =>
  columns.filter(
    (col) =>
      !isTableGroupHierarchyColumn(col.key) &&
      (!col.render || resolveColumnCapabilities(col).isStatic),
  );
