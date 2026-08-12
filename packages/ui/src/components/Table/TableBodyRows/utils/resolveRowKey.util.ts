import type { TableColumn } from '#ui/components/Table/Table.types';

import { PRIMARY_KEY_ID_DELIMITER } from '#ui/components/Table/Table.constants';
import { resolvePrimaryKeyColumnKeys } from '#ui/components/Table/utils/resolvePrimaryKeyColumnKeys.util';

type ResolveRowKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly index: number;
  readonly row: TData;
};

/**
 * The two key kinds must stay distinguishable, and neither prefix may be a
 * prefix of the other. Unprefixed, a row whose primary key is the text of some
 * row's index would produce that row's key — and React would reconcile the two
 * as the same row.
 */
const INDEX_KEY_PREFIX = 'idx:';
const VALUE_KEY_PREFIX = 'pk:';

const isScalarKeyValue = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';

/**
 * Row identity for React reconciliation, derived from the primary-key
 * column(s) — the same source `resolveCrudRowId` draws a CRUD id from, but
 * total. A key is needed for every row on every render, so an unresolvable one
 * degrades to an index-derived key rather than throwing and taking the whole
 * table to an error boundary (ADR-062). The index-derived key is exactly as
 * unstable as keying by index, which is the floor this replaces.
 */
export const resolveRowKey = <TData extends Record<string, unknown>>({
  columns,
  index,
  row,
}: ResolveRowKeyArgs<TData>) => {
  const indexKey = `${INDEX_KEY_PREFIX}${index}`;
  const primaryKeyKeys = resolvePrimaryKeyColumnKeys({ columns });

  if (primaryKeyKeys.length === 0) {
    return indexKey;
  }

  const encodedValues = primaryKeyKeys
    .map((key) => row[key])
    .filter(isScalarKeyValue)
    .map((value) => encodeURIComponent(String(value)));

  return encodedValues.length === primaryKeyKeys.length
    ? `${VALUE_KEY_PREFIX}${encodedValues.join(PRIMARY_KEY_ID_DELIMITER)}`
    : indexKey;
};
