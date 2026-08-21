import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';
import type { GroupKeyTruncation, OlapDrillTranslation } from './olap.types';

import { AGGREGATE_SQL } from '../group-query-builder/group-query-builder.constants.ts';
import { advanceGroupPeriod } from './advance-group-period.util.ts';
import { resolveDrillRefusal } from './resolve-drill-refusal.util.ts';

type ToDrillReadArgs = {
  /** The filters the grouped view was read under, unchanged. */
  readonly filters: readonly QueryFilter[];
  readonly group: OlapDrillGroup;
  /** The applied group keys, in nesting order — what "complete" is measured against. */
  readonly groupKeys: readonly string[];
  readonly limit: number;
  /** The route's own page ceiling. Passed in, because only the route knows it. */
  readonly maxLimit: number;
  /**
   * The column the route breaks ties on (ADR-008). Passed in for the same reason
   * as `maxLimit`, and required rather than optional: a page with no total order
   * repeats and skips rows, which reads as missing data rather than as a bug.
   */
  readonly primaryKey: string;
  /** The sort the grouped view was read under. */
  readonly sort: readonly QuerySort[];
  /** How each truncated key was derived, by column. Absent for an untruncated grouping. */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

/**
 * One equality per path entry — or `IS NULL`, which is not the same query.
 *
 * SQL equality against NULL is never true, so `shipping_country = NULL` returns
 * nothing at all. The NULL group is exactly the one a user is most likely to be
 * puzzled by and click into, so the wrong spelling here fails silently on the
 * most-clicked case (ADR-079). `undefined` takes the same branch: it can only
 * mean the key never arrived, and an equality against it is the same dead
 * comparison.
 */
const toKeyFilter = ({
  columnKey,
  value,
}: OlapDrillGroup['path'][number]): QueryFilter =>
  value === null || value === undefined
    ? { column: columnKey, operator: 'isNull' }
    : { column: columnKey, operator: 'eq', value };

/**
 * The period's first instant, or `undefined` when the value is not one.
 *
 * `pg` hands a truncated key back as a `Date`; the string and number arms are
 * for a caller that round-tripped the group through JSON, which is what the
 * drill param does. Anything else is refused rather than coerced — `String()`
 * over an object yields `[object Object]`, and `new Date` of that is an
 * Invalid Date whose range would silently return the wrong rows.
 */
const toPeriodStart = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') return;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * A truncated key's filter: the half-open range `[start, next)` on the **raw**
 * column (#786).
 *
 * Equality cannot express it. The group `2021-03` is `date_trunc('month', …)`,
 * and no row holds that value — every row holds an instant inside the month —
 * so `order_date = '2021-03-01'` returns the first of the month and nothing
 * else. Half-open rather than `lte` the last instant, because "the last instant
 * of March" has no representation a timestamp can hold exactly.
 *
 * The NULL branch is unchanged and comes first: `date_trunc` of NULL is NULL, so
 * a truncated key has a NULL group exactly as an untruncated one does, and it is
 * still the group a range comparison would silently return nothing for.
 */
const toPeriodFilters = ({
  entry,
  truncation,
}: {
  readonly entry: OlapDrillGroup['path'][number];
  readonly truncation: GroupKeyTruncation;
}): readonly QueryFilter[] => {
  const { columnKey, value } = entry;

  if (value === null || value === undefined) {
    return [{ column: columnKey, operator: 'isNull' }];
  }

  const start = toPeriodStart(value);

  if (start === undefined) {
    // Not a date the grouping could have produced. Falling back to equality is
    // the honest failure: it returns nothing rather than a range drawn from a
    // parsed-to-garbage boundary, which would return the wrong rows and look
    // right.
    return [toKeyFilter(entry)];
  }

  return [
    { column: columnKey, operator: 'gte', value: start },
    {
      column: columnKey,
      operator: 'lt',
      value: advanceGroupPeriod({ ...truncation, start }),
    },
  ];
};

/**
 * Whether a sort term names a **measure column** rather than a real column.
 *
 * The grid renders one column per applied aggregate and keys it `column:fn`
 * (`total_amount:avg`), and that key is ordinary sort state that travels with
 * the request. A grouped read can honour it — `toGroupSort` maps it onto the
 * aggregate's alias — but a drill is an **ungrouped** read of one group's rows,
 * where no such column exists: `buildOrderByClause` validates every term
 * against `allowedColumns` and refuses the whole query, so the drill fails
 * rather than the term being ignored.
 *
 * Dropped here for the same reason group-key terms are: this function's job is
 * translating grouped-view state into a read that has no grouping in it, and a
 * measure term is grouped-view state by construction.
 *
 * `AGGREGATE_SQL` is the closed exhaustive map, so a new `AggregateFn` is
 * covered the day it is added. The split is on the **last** colon because the
 * function name never contains one. This is the third place the `column:fn`
 * spelling is written — see #876, which moves the codec somewhere both packages
 * can depend on instead.
 */
const isMeasureSortTerm = (column: string) => {
  const separator = column.lastIndexOf(':');

  return (
    separator > 0 && Object.hasOwn(AGGREGATE_SQL, column.slice(separator + 1))
  );
};

/**
 * Turns a group row into the paginated read of the rows underneath it (ADR-079).
 *
 * **Filter inheritance is the correctness criterion, and it fails quietly.** A
 * drilled read that drops the grouped view's filters returns rows that are true
 * facts about the table and wrong under the heading they appear beneath — a
 * group stating 214 orders with 1,008 rows under it, dated outside the range the
 * user set. Both render, neither throws, and every number is individually
 * correct. So the view's filters go in first and unchanged, and the group's own
 * keys are appended to them rather than replacing them.
 *
 * **A truncated key becomes a range, not an equality** (#786). The group's value
 * is a period start that no row holds, so equality returns the boundary row and
 * nothing else — see `toPeriodFilters`.
 *
 * **Group-key terms and measure terms are dropped from the sort** — the first
 * because they are constant within a group and order nothing, the second
 * because the column they name exists only in the grouped view (see
 * `isMeasureSortTerm`); the caller's primary key is appended so the page is
 * deterministic (ADR-008). Without it two rows equal on every remaining term can
 * come back in any order, which repeats and skips rows across pages.
 */
export const toDrillRead = ({
  filters,
  group,
  groupKeys,
  limit,
  maxLimit,
  primaryKey,
  sort,
  truncations,
}: ToDrillReadArgs): OlapDrillTranslation => {
  // Delegated rather than inlined so a route can ask the same question before
  // resolving anything a refusal would not have needed — see
  // `resolveDrillRefusal`.
  const refusal = resolveDrillRefusal({ group, groupKeys });

  if (refusal !== undefined) {
    return { kind: 'refused', reason: refusal };
  }

  const groupedColumns = new Set(group.path.map(({ columnKey }) => columnKey));
  const remainingSort = sort.filter(
    ({ column }) => !groupedColumns.has(column) && !isMeasureSortTerm(column),
  );
  const hasTiebreaker = remainingSort.some(
    ({ column }) => column === primaryKey,
  );

  return {
    kind: 'drillable',
    read: {
      filters: [
        ...filters,
        ...group.path.flatMap((entry) => {
          const truncation = truncations?.[entry.columnKey];

          return truncation === undefined
            ? [toKeyFilter(entry)]
            : toPeriodFilters({ entry, truncation });
        }),
      ],
      // The group row already states its own `count`, so counting the same set
      // again would be work with a known answer.
      includeTotal: false,
      limit: Math.min(maxLimit, Math.max(1, limit)),
      offset: 0,
      sort: hasTiebreaker
        ? remainingSort
        : [...remainingSort, { column: primaryKey, direction: 'asc' }],
    },
  };
};
