import type { TableAggregateFn } from '#ui/components/Table/Table.types';

/**
 * Compact wire form of the `grouping` param:
 * `{"agg":{"total_amount":"sum"},"keys":["order_status","shipping_country"]}`.
 * Plain JSON like `sorting` and `filters`, with no transport layer (ADR-061).
 *
 * The **envelope** is closed here — `keys` and `agg` are the only members the
 * narrowing admits, every key must be a string, and every aggregate must be a
 * `TableAggregateFn`. Which columns are legal group keys, and which aggregates
 * are legal for a column, are questions about a route rather than about a URL:
 * the first is answered later by `sanitizeGroupingByColumns`, the second by the
 * catalogue (ADR-058). Both this and the sanitizer refuse whole rather than per
 * entry.
 *
 * `agg` is a column-to-function map with no room for a filter or an alias, and
 * that is the shape of the deferral in #569: a *filtered* aggregate has nowhere
 * to travel in this param, so no shareable grouping can describe one.
 */
export type CompactGrouping = {
  readonly agg?: Readonly<Record<string, TableAggregateFn>>;
  readonly keys: readonly string[];
};

/**
 * Compact wire form of the `sorting` param: `{"name":"asc"}`. The direction
 * vocabulary is closed here so the codec's narrowing has something to check a
 * URL-supplied token against.
 */
export type CompactSorting = Record<string, 'asc' | 'desc'>;
