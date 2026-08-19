import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';
import type { OlapDrillTranslation } from './olap.types';

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
 * **Group-key terms are dropped from the sort** because they are constant within
 * a group and order nothing; the caller's primary key is appended so the page is
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
}: ToDrillReadArgs): OlapDrillTranslation => {
  // Grand total first: it is *also* `isSubtotal`, so testing the subtotal rule
  // ahead of it would report every grand total as a subtotal and hide the more
  // specific answer.
  if (group.path.length === 0) {
    return { kind: 'refused', reason: 'grand-total' };
  }

  if (group.isSubtotal) {
    return { kind: 'refused', reason: 'subtotal' };
  }

  if (group.path.length !== groupKeys.length) {
    return { kind: 'refused', reason: 'incomplete-path' };
  }

  const groupedColumns = new Set(group.path.map(({ columnKey }) => columnKey));
  const remainingSort = sort.filter(
    ({ column }) => !groupedColumns.has(column),
  );
  const hasTiebreaker = remainingSort.some(
    ({ column }) => column === primaryKey,
  );

  return {
    kind: 'drillable',
    read: {
      filters: [...filters, ...group.path.map((entry) => toKeyFilter(entry))],
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
