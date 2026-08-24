import type {
  AggregateFn,
  BuiltGroupAggregate,
  GroupAggregate,
  GroupSort,
} from '../group-query-builder/group-query-builder.types';
import type { QuerySort } from '../query-builder/query-builder.types';
import type { GroupKeyTruncation } from './olap.types';

import { resolveAggregateAlias } from '../group-query-builder/resolve-aggregate-alias.util';
import { toGroupRow } from './to-group-row.util';

export type RequestedGroupAggregate = {
  readonly column: string;
  readonly fn: AggregateFn;
};

type DecodeGroupedRowsArgs = {
  readonly aggregates: readonly BuiltGroupAggregate[];
  readonly columnKeys: readonly string[];
  readonly maskAlias: string;
  readonly requested: readonly RequestedGroupAggregate[];
  readonly rows: readonly Record<string, unknown>[];
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

type ToGroupSortArgs = {
  readonly groupKeys: readonly string[];
  readonly requested?: readonly RequestedGroupAggregate[];
  readonly sort: readonly QuerySort[];
};

/**
 * **This and `decodeGroupedRows` are two halves of one convention** and live together for
 * the reason ADR-082 keeps an encoder beside its parser: the position `count` occupies
 * here is the position the decode skips, and nothing in the type system relates the two.
 */
export const toGroupAggregates = ({
  requested,
}: {
  readonly requested: readonly RequestedGroupAggregate[];
}): readonly GroupAggregate[] => [{ fn: 'count' }, ...requested];

/**
 * The rows of a grouped read, decoded into the group rows a grid renders.
 * Pairs each requested aggregate with the alias the builder projected it under, reading
 * the alias off the builder's own result rather than re-deriving the name — so the string
 * the SQL emitted and the string this decodes by are one string, and a change to the
 * builder's alias rule cannot silently strand a caller.
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
 * **Duplicated from `@lcabrera/ui`'s `toTableAggregateToken`** rather than imported, for
 * the reason every grouping shape in this package is
 * ([ADR-039](../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)): a
 * client-safe package and a Node-only one may not depend on each other, and a shared
 * contracts package needs a third *consumer*, not a third copy.
 * `groupingContract.test.ts` pins the aggregate vocabulary, the depth cap and the refusal
 * unions; it says nothing about this format, because neither half is reachable from it —
 * `toTableAggregateToken` is not on `@lcabrera/ui`'s export map and this is
 * module-private.
 */
const toAggregateSortKey = ({ column, fn }: RequestedGroupAggregate) =>
  `${column}:${fn}`;

/**
 * The nesting order is not negotiable — it *is* the tree — so a user's sort sets a level's
 * direction rather than reordering the levels, and under a rollup the `GROUPING` term
 * keeps its own placement so a subtotal stays a footer whichever way its key runs (#570).
 * The alias is derived by `resolveAggregateAlias` — the builder's own function, not a
 * second spelling of its rule — so the term the sort emits and the column the projection
 * emits cannot come to disagree.
 */
export const toGroupSort = ({
  groupKeys,
  requested = [],
  sort,
}: ToGroupSortArgs): readonly GroupSort[] => {
  const keyTerms: GroupSort[] = groupKeys.map((key) => ({
    direction: sort.find((entry) => entry.column === key)?.direction ?? 'asc',
    key,
  }));

  const aggregateTerms = sort.flatMap((entry) => {
    const measure = requested.find(
      (aggregate) => toAggregateSortKey(aggregate) === entry.column,
    );

    return measure === undefined
      ? []
      : [
          {
            aggregateAlias: resolveAggregateAlias(measure),
            direction: entry.direction,
          },
        ];
  });

  return [...keyTerms, ...aggregateTerms];
};
