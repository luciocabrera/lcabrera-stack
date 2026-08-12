import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { isTableAggregateFn } from '#ui/components/Table/utils/isTableAggregateFn.util';

import type { CompactGrouping } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/** What `deserialize` answers for anything it refuses: no grouping at all. */
const NO_GROUPING: CompactGrouping = { keys: [] };

/**
 * The envelope's **whole** vocabulary. Aggregate selection needed a second
 * slot, so the closed set was extended; opening it is what ADR-061 forbids, and
 * a member outside these two still refuses the payload.
 */
const COMPACT_GROUPING_MEMBERS: ReadonlySet<string> = new Set(['agg', 'keys']);

const isString = (value: unknown): value is string => typeof value === 'string';

const narrowKeys = (value: unknown) => {
  if (!Array.isArray(value)) {
    return;
  }

  const keys: readonly unknown[] = value;

  return keys.every(isString) ? [...keys] : undefined;
};

const narrowAggregates = (value: unknown) => {
  if (!isObject(value) || Array.isArray(value)) {
    return;
  }

  const entries = Object.entries(value);

  if (entries.some(([, fn]) => !isTableAggregateFn(fn))) {
    return;
  }

  return Object.fromEntries(entries) as Readonly<
    Record<string, TableAggregateFn>
  >;
};

/**
 * Accepts `{"keys":["order_status"]}` and, optionally beside it,
 * `{"agg":{"total_amount":"sum"}}` — a **column-to-function** map, at most one
 * aggregate per column. Nothing else: a third member, a missing `keys`, a
 * misspelling, one non-string key, or an aggregate token outside
 * `TableAggregateFn` refuses the **whole** payload.
 *
 * Refusing whole is the point (ADR-061): grouping changes the SQL a route
 * emits, so a partly-accepted configuration would run a query nobody asked for
 * while the URL still reads as the one that was shared. Group keys are ordered
 * and the order is the query's nesting order, so dropping one silently answers
 * a different question from the one the URL describes. A flat table is the
 * honest answer to a param that cannot be read.
 *
 * **A filtered aggregate cannot be expressed here, deliberately** (#569). A
 * per-aggregate filter or alias needs a slot this map has none of, so deferring
 * filtered aggregates is not an unimplemented option: the transport every piece
 * of grouping configuration must round-trip through cannot carry one, and no
 * interaction can construct what it cannot serialize.
 *
 * The member check is what makes `__proto__` a non-issue without special
 * handling: `JSON.parse` gives it as an own property, so a payload carrying one
 * has a member outside the set and is refused. The accepted shape is rebuilt as
 * an object literal with fixed keys, and the aggregate map with
 * `Object.fromEntries` — neither reaches a prototype setter.
 */
const narrowCompactGrouping = (parsed: unknown) => {
  if (!isObject(parsed) || Array.isArray(parsed)) {
    return;
  }

  const isEnvelopeClosed =
    Object.hasOwn(parsed, 'keys') &&
    Object.keys(parsed).every((name) => COMPACT_GROUPING_MEMBERS.has(name));

  if (!isEnvelopeClosed) {
    return;
  }

  const keys = narrowKeys(parsed.keys);

  if (keys === undefined) {
    return;
  }

  if (!Object.hasOwn(parsed, 'agg')) {
    return { keys } satisfies CompactGrouping;
  }

  const agg = narrowAggregates(parsed.agg);

  return agg === undefined
    ? undefined
    : ({ agg, keys } satisfies CompactGrouping);
};

/** Codec for the compact `grouping` search param. */
export const groupingCodec = createUrlStateCodec<CompactGrouping>({
  // An empty `agg` is dropped rather than emitted, so a table with no aggregate
  // selected produces the same param it produced before aggregates existed —
  // `"agg":{}` in a shared link would say "aggregates considered and cleared",
  // which is not a state this table has.
  compact: ({ agg, keys }) =>
    agg === undefined || Object.keys(agg).length === 0
      ? { keys }
      : { agg, keys },
  fallback: NO_GROUPING,
  label: 'grouping',
  narrow: narrowCompactGrouping,
});
