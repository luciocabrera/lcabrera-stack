import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';
import { resolvePrimaryKeyColumnKeys } from '#ui/components/Table/utils/resolvePrimaryKeyColumnKeys.util';

type ResolveRowKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly index: number;
  readonly row: TData;
};

/**
 * No prefix may be a prefix of another, so the three kinds of key occupy
 * disjoint namespaces whatever any one of them encodes. The tuple encoding
 * below already makes a cross-namespace collision unconstructible on its own —
 * these prefixes are what keeps that true if the encoding ever changes.
 */
const GROUP_KEY_PREFIX = 'grp:';
const INDEX_KEY_PREFIX = 'idx:';
const VALUE_KEY_PREFIX = 'pk:';

const isScalarKeyValue = (value: unknown): value is number | string =>
  typeof value === 'string' ||
  (typeof value === 'number' && Number.isFinite(value));

/**
 * Row identity for React reconciliation, derived from the primary-key column(s) — the same
 * columns `resolveCrudRowId` reads, through the shared `resolvePrimaryKeyColumnKeys`, but
 * neither the same encoding nor the same failure mode.
 * It never throws.
 */
export const resolveRowKey = <TData extends Record<string, unknown>>({
  columns,
  index,
  row,
}: ResolveRowKeyArgs<TData>) => {
  const indexKey = `${INDEX_KEY_PREFIX}${index}`;
  const groupSummary = getTableGroupRowSummary(row);

  if (groupSummary !== undefined) {
    return `${GROUP_KEY_PREFIX}${resolveGroupPathKey(groupSummary.path)}`;
  }

  const primaryKeyKeys = resolvePrimaryKeyColumnKeys({ columns });

  if (primaryKeyKeys.length === 0) {
    return indexKey;
  }

  const values = primaryKeyKeys.map((key) => row[key]);

  return values.every(isScalarKeyValue)
    ? `${VALUE_KEY_PREFIX}${JSON.stringify(values)}`
    : indexKey;
};
