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

const NO_GROUPING: CompactGrouping = { keys: [] };

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

const narrowAggregateTokens = (value: unknown) => {
  const tokens = narrowKeys(value);

  return tokens === undefined ? undefined : parseTableAggregateTokens(tokens);
};

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
    narrow: narrowAggregateTokens,
    parsed,
  });
  const gran = readOptionalMember({
    member: 'gran',
    narrow: (value) => narrowGranularities({ keys, value }),
    parsed,
  });
  const mode = readOptionalMember({
    member: 'mode',
    narrow: narrowMode,
    parsed,
  });
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
    ...(gran !== undefined && Object.keys(gran).length > 0 && { gran }),
    keys,
    ...(mode !== undefined && mode !== 'flat' && { mode }),
    ...(share !== undefined &&
      share.length > 0 && {
        share: share.map((entry) => toTableAggregateToken(entry)),
      }),
  }),
  fallback: NO_GROUPING,
  label: 'grouping',
  narrow: narrowCompactGrouping,
});
