import type {
  TableAggregateFn,
  TableGroupingMode,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

/**
 * Compact wire form of the `grouping` param:
 * `{"agg":{"total_amount":"sum"},"keys":["order_status"],"mode":"rollup"}`.
 * Plain JSON like `sorting` and `filters`, with no transport layer (ADR-061).
 *
 * The **envelope** is closed here — `keys`, `agg`, `gran` and `mode` are the
 * only members the narrowing admits, every key must be a string, every aggregate
 * must be a `TableAggregateFn`, and the mode a `TableGroupingMode`. Which
 * columns are legal group keys, and which aggregates are legal for a column,
 * are questions about a route rather than about a URL: the first is answered
 * later by `sanitizeGroupingByColumns`, the second by the catalogue (ADR-058).
 * Both this and the sanitizer refuse whole rather than per entry.
 *
 * `agg` is a column-to-function map with no room for a filter or an alias, and
 * that is the shape of the deferral in #569: a *filtered* aggregate has nowhere
 * to travel in this param, so no shareable grouping can describe one.
 *
 * `mode` is optional, and absent means `flat` — so a link written before rollup
 * existed still reads, and a table left on the default emits the param it
 * always did.
 */
export type CompactGrouping = {
  readonly agg?: Readonly<Record<string, TableAggregateFn>>;
  /**
   * The granularity each temporal key is grouped at — a column-to-period map,
   * the same shape as `agg` and per-key by construction, since a column can be
   * a group key at most once (#786).
   */
  readonly gran?: Readonly<Record<string, TableGroupPeriod>>;
  readonly keys: readonly string[];
  readonly mode?: TableGroupingMode;
};

/**
 * Compact wire form of the `sorting` param: `{"name":"asc"}`. The direction
 * vocabulary is closed here so the codec's narrowing has something to check a
 * URL-supplied token against.
 */
export type CompactSorting = Record<string, 'asc' | 'desc'>;
