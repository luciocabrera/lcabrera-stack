import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

type ToGroupKeyColumnOptionsArgs<TData extends Record<string, unknown>> = {
  readonly allowRequiredPeriod?: boolean;
  readonly capabilities: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly columns: readonly TableColumn<TData>[];
  readonly stagedKeys: ReadonlySet<string>;
};

export const toGroupKeyColumnOptions = <TData extends Record<string, unknown>>({
  allowRequiredPeriod = true,
  capabilities,
  columns,
  stagedKeys,
}: ToGroupKeyColumnOptionsArgs<TData>) =>
  columns.flatMap((column) => {
    if (stagedKeys.has(String(column.key))) return [];

    const availability = resolveGroupKeyAvailability<TData>({
      capability: capabilities[String(column.key)],
      column,
    });

    if (!availability.isGroupable) return [];

    if (!allowRequiredPeriod && availability.requiredPeriod !== undefined) {
      return [];
    }

    return [{ label: column.label, value: String(column.key) }];
  });
