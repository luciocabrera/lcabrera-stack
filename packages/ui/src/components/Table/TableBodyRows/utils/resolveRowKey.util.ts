import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolvePrimaryKeyColumnKeys } from '#ui/components/Table/utils/resolvePrimaryKeyColumnKeys.util';

type ResolveRowKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly index: number;
  readonly row: TData;
};

/**
 * Neither prefix may be a prefix of the other, so the two kinds of key occupy
 * disjoint namespaces whatever either one encodes. The tuple encoding below
 * already makes a cross-namespace collision unconstructible on its own — these
 * prefixes are what keeps that true if the encoding ever changes.
 */
const INDEX_KEY_PREFIX = 'idx:';
const VALUE_KEY_PREFIX = 'pk:';

/**
 * A non-finite number is rejected rather than accepted as an id. `NaN` is not
 * equal to itself, and `NaN`, `Infinity` and `-Infinity` all serialize to
 * `null`, so accepting them would hand three different rows one key. An id that
 * is not finite is a failed parse, which is what the fallback is for.
 */
const isScalarKeyValue = (value: unknown): value is number | string =>
  typeof value === 'string' ||
  (typeof value === 'number' && Number.isFinite(value));

/**
 * Row identity for React reconciliation, derived from the primary-key
 * column(s) — the same columns `resolveCrudRowId` reads, through the shared
 * `resolvePrimaryKeyColumnKeys`, but neither the same encoding nor the same
 * failure mode.
 *
 * It never throws. A key is needed for every row on every render, so a throw
 * here would take the whole table to an error boundary; an unresolvable key
 * degrades to the row's index instead (ADR-062).
 *
 * The value part is `JSON.stringify` over the resolved tuple, which is what
 * makes "never throws" hold in the first place: it is well-formed by spec, so
 * an unpaired surrogate escapes where `encodeURIComponent` raises `URIError`.
 * The same encoding is why the tuple stays unambiguous across element
 * boundaries — a delimiter-joined form collides as soon as a value contains the
 * delimiter — and why `7` stays distinct from `'7'`, which `String` cannot do.
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

  const values = primaryKeyKeys.map((key) => row[key]);

  return values.every(isScalarKeyValue)
    ? `${VALUE_KEY_PREFIX}${JSON.stringify(values)}`
    : indexKey;
};
