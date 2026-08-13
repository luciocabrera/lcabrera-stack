import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

type ToGroupKeyColumnOptionsArgs<TData extends Record<string, unknown>> = {
  readonly capabilities: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly columns: readonly TableColumn<TData>[];
  /** The keys already staged in the draft — a `Set`, so the filter stays linear. */
  readonly stagedKeys: ReadonlySet<string>;
};

/**
 * The columns that may still be added as a group key, as select options.
 *
 * Gated on `resolveGroupKeyAvailability`, so the drawer offers exactly what the
 * header menu leaves enabled: the column's own declaration narrowed by the
 * catalogue's answer (ADR-058, #642). A refused column is left out rather than
 * listed and disabled — a `VirtualSelect` option carries no room for a reason,
 * and the header menu is where a user asks about one specific column.
 *
 * Iterating the columns rather than the capability map keeps the list in the
 * table's own display order and gives each option a human label.
 */
export const toGroupKeyColumnOptions = <TData extends Record<string, unknown>>({
  capabilities,
  columns,
  stagedKeys,
}: ToGroupKeyColumnOptionsArgs<TData>) =>
  columns
    .filter(
      (column) =>
        !stagedKeys.has(String(column.key)) &&
        resolveGroupKeyAvailability<TData>({
          capability: capabilities[String(column.key)],
          column,
        }).isGroupable,
    )
    .map((column) => ({ label: column.label, value: String(column.key) }));
