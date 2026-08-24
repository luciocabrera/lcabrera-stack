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
  readonly stagedKeys: ReadonlySet<string>;
};

/**
 * Gated on `resolveGroupKeyAvailability`, so the drawer offers exactly what the header
 * menu leaves enabled: the column's own declaration narrowed by the catalogue's answer
 * (ADR-058, #642).
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
