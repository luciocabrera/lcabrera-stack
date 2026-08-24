import { isOlapGroupPeriod } from '@lcabrera/api/olap/is-olap-group-period.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

import { isTableGroupingMode } from '#ui/components/Table/utils/isTableGroupingMode.util';
import {
  parseTableAggregateTokens,
  toTableAggregateToken,
} from '#ui/components/Table/utils/tableAggregateToken.util';

import type { CompactGrouping } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/** What `deserialize` answers for anything it refuses: no grouping at all. */
const NO_GROUPING: CompactGrouping = { keys: [] };

/**
 * Aggregate selection needed a second slot, the grouping mode a third, per-key granularity
 * a fourth and the share a fifth, so the closed set has been extended four times; opening
 * it is what ADR-061 forbids, and a member outside these five still refuses the payload.
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

/**
 * A token whose suffix names no legal function refuses the **whole** payload rather than
 * being dropped, like every other malformed member (ADR-061): a link promising two
 * measures that opened showing one would be worse than a flat table.
 */
const narrowAggregateTokens = (value: unknown) => {
  const tokens = narrowKeys(value);

  return tokens === undefined ? undefined : parseTableAggregateTokens(tokens);
};

/**
 * The granularity map, or `undefined` when it is unreadable.
 * A period outside the vocabulary refuses the **whole** payload rather than being dropped,
 * and a granularity naming a column that is not a group key does too.
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
 * `refused` is not `absent`: a member that is present and unreadable rejects the **whole**
 * payload, and collapsing the two is how a partly-accepted configuration would get through
 * (ADR-061).
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

/**
 * Accepts `{"keys":["order_status"]}` and, optionally beside it,
 * `{"agg":["total_amount:sum","total_amount:avg"]}` — an **ordered array of
 * `"<columnKey>:<fn>"` tokens**, any number of them per column — plus `{"gran":…}`,
 * `{"mode":"rollup"}` and `{"share":[…]}` in the same token form.
 * Nothing else: a sixth member, a missing `keys`, a misspelling, one non-string element,
 * an aggregate token whose suffix is outside `TableAggregateFn`, or a mode outside
 * `TableGroupingMode` refuses the **whole** payload.
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

  const agg = readOptionalMember({
    member: 'agg',
    narrow: narrowAggregateTokens,
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
  // an aggregate, and one this envelope cannot read is a percentage the link
  // promised and the table would not show. It takes `agg`'s narrower because it
  // takes `agg`'s element — a column carrying both `sum` and `count` needs the
  // function to say which measure's share is meant (#831).
  const share = readOptionalMember({
    member: 'share',
    narrow: narrowAggregateTokens,
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
  // `"agg":[]` in a shared link would say "aggregates considered and cleared",
  // which is not a state this table has.
  //
  // The token form is written **here and nowhere else**, so the string shape and
  // the right-split that reads it back stay one decision (`narrowAggregateTokens`
  // above). No component ever builds or parses one.
  compact: ({ agg, gran, keys, mode, share }) => ({
    ...(agg !== undefined &&
      agg.length > 0 && {
        agg: agg.map((entry) => toTableAggregateToken(entry)),
      }),
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
    ...(share !== undefined &&
      share.length > 0 && {
        share: share.map((entry) => toTableAggregateToken(entry)),
      }),
  }),
  fallback: NO_GROUPING,
  label: 'grouping',
  narrow: narrowCompactGrouping,
});
