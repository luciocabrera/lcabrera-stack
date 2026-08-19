import type {
  AggregateFn,
  BuiltGroupAggregate,
  GroupAggregate,
  GroupSort,
} from '../group-query-builder/group-query-builder.types';
import type { QuerySort } from '../query-builder/query-builder.types';
import type { GroupKeyTruncation } from './olap.types';

import { toGroupRow } from './to-group-row.util';

/** One aggregate a route asked for, before the builder has aliased it. */
export type RequestedGroupAggregate = {
  readonly column: string;
  readonly fn: AggregateFn;
};

type DecodeGroupedRowsArgs = {
  /** `selectGroupedRows`' emitted aggregates, in the order they were requested. */
  readonly aggregates: readonly BuiltGroupAggregate[];
  /** The group keys, in the query's nesting order. */
  readonly columnKeys: readonly string[];
  readonly maskAlias: string;
  /** The same list `toGroupAggregates` was given, in the same order. */
  readonly requested: readonly RequestedGroupAggregate[];
  readonly rows: readonly Record<string, unknown>[];
  /** How each truncated key was derived, by column — what heads a period group (#786). */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

type ToGroupSortArgs = {
  /** The group keys, in nesting order. */
  readonly groupKeys: readonly string[];
  /** The table's applied sort, over its own columns. */
  readonly sort: readonly QuerySort[];
};

/**
 * The aggregate list a grouped read is issued with: `count(*)` first, then the
 * route's own.
 *
 * `count(*)` is not optional — a group row states how many rows it covers, so
 * every grouped read asks for it whether or not the route selected any
 * aggregate at all.
 *
 * **This and `decodeGroupedRows` are two halves of one convention** and live
 * together for the reason ADR-082 keeps an encoder beside its parser: the
 * position `count` occupies here is the position the decode skips, and nothing
 * in the type system relates the two. Split across modules they can disagree in
 * any way at all and still compile, and the symptom is every aggregate rendering
 * one column to the left.
 */
export const toGroupAggregates = ({
  requested,
}: {
  readonly requested: readonly RequestedGroupAggregate[];
}): readonly GroupAggregate[] => [{ fn: 'count' }, ...requested];

/**
 * The rows of a grouped read, decoded into the group rows a grid renders.
 *
 * Pairs each requested aggregate with the alias the builder projected it under,
 * reading the alias off the builder's own result rather than re-deriving the
 * name — so the string the SQL emitted and the string this decodes by are one
 * string, and a change to the builder's alias rule cannot silently strand a
 * caller.
 *
 * The offset by one is `count(*)`, which `toGroupAggregates` puts first. See
 * there for why the two belong in one module.
 *
 * **The pairing is checked at every position, not just counted.** Decoding is
 * positional, so a `requested` list of the right length in the wrong order is
 * the dangerous input: it mislabels every aggregate and reads the count off
 * whichever alias happens to be first. Length alone cannot see that, and
 * `BuiltGroupAggregate` carries the `fn` and `column` that can — so each pair is
 * asserted to agree before a row is touched.
 *
 * The failure being refused is the quiet one. A mismatch that decoded anyway
 * yields `row[undefined]` or the wrong column's value, so every group reports a
 * count of `NaN` or an aggregate belonging to its neighbour — valid-looking rows
 * carrying wrong data, with nothing thrown and nothing logged. A caller in that
 * state has passed a list that is not the one the read was issued with, which is
 * a programming error and is worth naming where it is still detectable.
 */
export const decodeGroupedRows = ({
  aggregates,
  columnKeys,
  maskAlias,
  requested,
  rows,
  truncations,
}: DecodeGroupedRowsArgs) => {
  const [count, ...selected] = aggregates;

  if (count === undefined || selected.length !== requested.length) {
    throw new Error(
      `Grouped read emitted ${String(aggregates.length)} aggregate alias(es) but ${String(requested.length + 1)} were requested (count(*) plus ${String(requested.length)}); pass the same list \`toGroupAggregates\` was given.`,
    );
  }

  if (count.fn !== 'count' || count.column !== undefined) {
    throw new Error(
      `Grouped read projected \`${count.fn}\` first, not \`count(*)\`; the aggregate list was not built by \`toGroupAggregates\`.`,
    );
  }

  const decoded = requested.map((aggregate, index) => {
    // Non-null by the length guard above; the fallback is unreachable and
    // present only for `noUncheckedIndexedAccess`.
    const emitted = selected[index] ?? count;

    if (emitted.fn !== aggregate.fn || emitted.column !== aggregate.column) {
      throw new Error(
        `Grouped read projected \`${emitted.fn}\` on \`${emitted.column ?? '*'}\` at position ${String(index + 1)} but \`${aggregate.fn}\` on \`${aggregate.column}\` was requested there; the two lists are ordered differently.`,
      );
    }

    return {
      alias: emitted.alias,
      columnKey: aggregate.column,
      fn: aggregate.fn,
    };
  });

  return rows.map((row) =>
    toGroupRow({
      aggregates: decoded,
      columnKeys,
      countAlias: count.alias,
      maskAlias,
      row,
      truncations,
    }),
  );
};

/**
 * The grouped read's ORDER BY, derived from the table's own sort.
 *
 * **One term per key, in nesting order**, carrying the user's direction where
 * they sorted that key and ascending where they did not. The nesting order is
 * not negotiable — it *is* the tree — so a user's sort sets a level's direction
 * rather than reordering the levels, and under a rollup the `GROUPING` term
 * keeps its own placement so a subtotal stays a footer whichever way its key
 * runs (#570).
 *
 * A sort on any other column is dropped rather than passed through, because a
 * grouped result has one row per group and no row of that column's values.
 * Aggregate sorts are a different shape (`GroupSort`'s `aggregateAlias` arm) and
 * are not derivable from a table sort, so a caller offering one builds it
 * itself.
 */
export const toGroupSort = ({
  groupKeys,
  sort,
}: ToGroupSortArgs): readonly GroupSort[] =>
  groupKeys.map((key) => ({
    direction: sort.find((entry) => entry.column === key)?.direction ?? 'asc',
    key,
  }));
