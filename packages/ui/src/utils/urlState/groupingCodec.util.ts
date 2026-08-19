import { isOlapGroupPeriod } from '@lcabrera/api/olap/is-olap-group-period.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  TableAggregateFn,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

import { isTableAggregateFn } from '#ui/components/Table/utils/isTableAggregateFn.util';
import { isTableGroupingMode } from '#ui/components/Table/utils/isTableGroupingMode.util';

import type { CompactGrouping } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/** What `deserialize` answers for anything it refuses: no grouping at all. */
const NO_GROUPING: CompactGrouping = { keys: [] };

/**
 * The envelope's **whole** vocabulary. Aggregate selection needed a second slot,
 * the grouping mode a third, per-key granularity a fourth and the share a
 * fifth, so the closed set has been extended four times; opening it is what
 * ADR-061 forbids, and a member outside these five still refuses the payload.
 */
const COMPACT_GROUPING_MEMBERS: ReadonlySet<string> = new Set([
  'agg',
  'gran',
  'keys',
  'mode',
  'share',
]);

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
 * The granularity map, or `undefined` when it is unreadable.
 *
 * A period outside the vocabulary refuses the **whole** payload rather than
 * being dropped, and a granularity naming a column that is not a group key does
 * too. Neither is inert: the first would run a grouping the link does not
 * describe, and the second is refused by the server, so accepting it here would
 * turn a shared link into a failed read rather than into a table (#786).
 */
const narrowGranularities = ({
  keys,
  value,
}: {
  readonly keys: readonly string[];
  readonly value: unknown;
}) => {
  if (!isObject(value) || Array.isArray(value)) {
    return;
  }

  const entries = Object.entries(value);
  // A Set rather than `keys.includes` inside the predicate: the predicate is
  // the loop, so an array scan per entry is quadratic.
  const applied = new Set(keys);

  if (
    entries.some(
      ([column, period]) => !isOlapGroupPeriod(period) || !applied.has(column),
    )
  ) {
    return;
  }

  return Object.fromEntries(entries) as Readonly<
    Record<string, TableGroupPeriod>
  >;
};

/**
 * Accepts `{"keys":["order_status"]}` and, optionally beside it,
 * `{"agg":{"total_amount":"sum"}}` — a **column-to-function** map, at most one
 * aggregate per column — and `{"mode":"rollup"}`. Nothing else: a fourth
 * member, a missing `keys`, a misspelling, one non-string key, an aggregate
 * token outside `TableAggregateFn`, or a mode outside `TableGroupingMode`
 * refuses the **whole** payload.
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
 * interaction can produce what it cannot serialize.
 * `@lcabrera/server`'s `GroupAggregate` still has the slot, so a consumer
 * calling its grouped read directly can build one — what is closed is every
 * path through this package, not the capability itself. Lifting the deferral
 * starts here, by giving this param somewhere to put a filter.
 *
 * The member check is what makes `__proto__` a non-issue without special
 * handling: `JSON.parse` gives it as an own property, so a payload carrying one
 * has a member outside the set and is refused. The accepted shape is rebuilt as
 * an object literal with fixed keys, and the aggregate map with
 * `Object.fromEntries` — neither reaches a prototype setter.
 */
/**
 * One optional member's outcome. `refused` is not `absent`: a member that is
 * present and unreadable rejects the **whole** payload, and collapsing the two
 * is how a partly-accepted configuration would get through (ADR-061).
 */
type NarrowedMember<TValue> =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: TValue }
  | { readonly kind: 'refused' };

const ABSENT = { kind: 'absent' } as const;
const REFUSED = { kind: 'refused' } as const;

type ReadOptionalMemberArgs<TValue> = {
  readonly member: string;
  readonly narrow: (value: unknown) => TValue | undefined;
  readonly parsed: Record<string, unknown>;
};

/**
 * Reads one optional member under the envelope's single rule, so `agg`, `gran`
 * and `mode` cannot come to be refused on three slightly different terms.
 */
const readOptionalMember = <TValue>({
  member,
  narrow,
  parsed,
}: ReadOptionalMemberArgs<TValue>): NarrowedMember<TValue> => {
  if (!Object.hasOwn(parsed, member)) return ABSENT;

  const value = narrow(parsed[member]);

  return value === undefined ? REFUSED : { kind: 'present', value };
};

const narrowMode = (value: unknown) =>
  isTableGroupingMode(value) ? value : undefined;

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

  const agg = readOptionalMember({
    member: 'agg',
    narrow: narrowAggregates,
    parsed,
  });
  const gran = readOptionalMember({
    member: 'gran',
    narrow: (value) => narrowGranularities({ keys, value }),
    parsed,
  });
  // A `mode` outside the union refuses the whole payload rather than falling
  // back to `flat`: the mode decides which grouping sets the read emits, so
  // substituting one answers a different question from the one the link
  // describes — the same whole-state rule the keys are refused under.
  const mode = readOptionalMember({
    member: 'mode',
    narrow: narrowMode,
    parsed,
  });
  // Refused rather than filtered for the same reason as the rest: a share names
  // a column, and one this envelope cannot read is a percentage the link
  // promised and the table would not show.
  const share = readOptionalMember({
    member: 'share',
    narrow: narrowKeys,
    parsed,
  });

  if (
    agg.kind === 'refused' ||
    gran.kind === 'refused' ||
    mode.kind === 'refused' ||
    share.kind === 'refused'
  ) {
    return;
  }

  return {
    ...(agg.kind === 'present' && { agg: agg.value }),
    ...(gran.kind === 'present' && { gran: gran.value }),
    keys,
    ...(mode.kind === 'present' && { mode: mode.value }),
    ...(share.kind === 'present' && { share: share.value }),
  } satisfies CompactGrouping;
};

/** Codec for the compact `grouping` search param. */
export const groupingCodec = createUrlStateCodec<CompactGrouping>({
  // An empty `agg` is dropped rather than emitted, so a table with no aggregate
  // selected produces the same param it produced before aggregates existed —
  // `"agg":{}` in a shared link would say "aggregates considered and cleared",
  // which is not a state this table has.
  compact: ({ agg, gran, keys, mode, share }) => ({
    ...(agg !== undefined && Object.keys(agg).length > 0 && { agg }),
    // Dropped when empty, like `agg`: an untruncated grouping produces the
    // param it produced before granularities existed.
    ...(gran !== undefined && Object.keys(gran).length > 0 && { gran }),
    keys,
    // `flat` is dropped rather than emitted, so a table left on the default
    // produces the param it produced before rollup existed — and a link is
    // shorter by the member nobody chose.
    ...(mode !== undefined && mode !== 'flat' && { mode }),
    // Dropped when empty, like `agg` and `gran`: a table with no share showing
    // produces the param it produced before shares existed.
    ...(share !== undefined && share.length > 0 && { share }),
  }),
  fallback: NO_GROUPING,
  label: 'grouping',
  narrow: narrowCompactGrouping,
});
