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
  readonly filters: readonly QueryFilter[];
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
  readonly limit: number;
  readonly maxLimit: number;
  /** The column the route breaks ties on (ADR-008). */
  readonly primaryKey: string;
  readonly sort: readonly QuerySort[];
  /** How each truncated key was derived, by column. Absent for an untruncated grouping. */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

/**
 * SQL equality against NULL is never true, so `shipping_country = NULL` returns nothing at
 * all.
 * The NULL group is exactly the one a user is most likely to be puzzled by and click into,
 * so the wrong spelling here fails silently on the most-clicked case (ADR-079).
 */
const toKeyFilter = ({
  columnKey,
  value,
}: OlapDrillGroup['path'][number]): QueryFilter =>
  value === null || value === undefined
    ? { column: columnKey, operator: 'isNull' }
    : { column: columnKey, operator: 'eq', value };

/**
 * Anything else is refused rather than coerced — `String()` over an object yields `[object
 * Object]`, and `new Date` of that is an Invalid Date whose range would silently return
 * the wrong rows.
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
 * Equality cannot express it.
 * The group `2021-03` is `date_trunc('month', …)`, and no row holds that value — every row
 * holds an instant inside the month — so `order_date = '2021-03-01'` returns the first of
 * the month and nothing else.
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
 * Dropped here for the same reason group-key terms are: this function's job is translating
 * grouped-view state into a read that has no grouping in it, and a measure term is
 * grouped-view state by construction.
 * The split is on the **last** colon because the function name never contains one.
 */
const isMeasureSortTerm = (column: string) => {
  const separator = column.lastIndexOf(':');

  return (
    separator > 0 && Object.hasOwn(AGGREGATE_SQL, column.slice(separator + 1))
  );
};

/**
 * Turns a group row into the paginated read of the rows underneath it (ADR-079).
 * **Group-key terms and measure terms are dropped from the sort** — the first because they
 * are constant within a group and order nothing, the second because the column they name
 * exists only in the grouped view (see `isMeasureSortTerm`); the caller's primary key is
 * appended so the page is deterministic (ADR-008).
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
