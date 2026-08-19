import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';
import type { TableGroupRowSummary } from '@lcabrera/ui/components/Table/Table.types';

import type { SelectOrdersPageArgs } from './enterpriseOrders.service';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config/enterpriseOrders.constants';

export type OrderDrillRead =
  | { readonly kind: 'drillable'; readonly read: SelectOrdersPageArgs }
  | { readonly kind: 'refused'; readonly reason: OrderDrillRefusal };

/**
 * Why a group row cannot be drilled. Distinguishable because they call for
 * different UI: a subtotal and a grand total should never offer the affordance
 * at all, where an incomplete path means the request and the row disagree and
 * is a bug rather than a state.
 */
export type OrderDrillRefusal = 'grand-total' | 'incomplete-path' | 'subtotal';

/**
 * Only what the translation reads. A whole `TableGroupRowSummary` satisfies it
 * structurally, so every existing caller is unaffected — but a caller that has
 * only a path and a flag, which is all an HTTP request can carry, does not have
 * to fabricate a `count` and an `aggregates` list nobody looks at.
 */
export type OrderDrillGroup = Pick<TableGroupRowSummary, 'isSubtotal' | 'path'>;

type ToOrderDrillReadArgs = {
  /** The filters the grouped view was read under, unchanged. */
  readonly filters: readonly QueryFilter[];
  /** The applied group keys, in nesting order — what "complete" is measured against. */
  readonly groupKeys: readonly string[];
  readonly limit: number;
  /** The sort the grouped view was read under. */
  readonly sort: readonly QuerySort[];
  readonly summary: OrderDrillGroup;
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
}: OrderDrillGroup['path'][number]): QueryFilter =>
  value === null || value === undefined
    ? { column: columnKey, operator: 'isNull' }
    : { column: columnKey, operator: 'eq', value };

/**
 * Turns a group row into the paginated read of the rows underneath it.
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
 * a group and order nothing; the route's primary-key tiebreaker is appended so
 * the page is deterministic (ADR-008). Without it two rows equal on every
 * remaining term can come back in any order, which repeats and skips rows across
 * pages.
 *
 * **The read carries no `grouping`.** Passing the view's grouping through would
 * send this straight back into the grouped branch of `selectOrdersPage` and
 * return group rows again — the one mistake that looks like it works.
 */
export const toOrderDrillRead = ({
  filters,
  groupKeys,
  limit,
  sort,
  summary,
}: ToOrderDrillReadArgs): OrderDrillRead => {
  // Grand total first: it is *also* `isSubtotal`, so testing the subtotal rule
  // ahead of it would report every grand total as a subtotal and hide the more
  // specific answer.
  if (summary.path.length === 0) {
    return { kind: 'refused', reason: 'grand-total' };
  }

  if (summary.isSubtotal) {
    return { kind: 'refused', reason: 'subtotal' };
  }

  if (summary.path.length !== groupKeys.length) {
    return { kind: 'refused', reason: 'incomplete-path' };
  }

  const groupedColumns = new Set(
    summary.path.map(({ columnKey }) => columnKey),
  );
  const remainingSort = sort.filter(
    ({ column }) => !groupedColumns.has(column),
  );
  const hasTiebreaker = remainingSort.some(
    ({ column }) => column === ENTERPRISE_ORDER_PRIMARY_KEY,
  );

  return {
    kind: 'drillable',
    read: {
      filters: [...filters, ...summary.path.map((entry) => toKeyFilter(entry))],
      // The group row already states its own `count`, so counting the same set
      // again would be work with a known answer.
      includeTotal: false,
      limit: Math.min(MAX_ENTERPRISE_ORDERS_LIMIT, Math.max(1, limit)),
      offset: 0,
      sort: hasTiebreaker
        ? remainingSort
        : [
            ...remainingSort,
            { column: ENTERPRISE_ORDER_PRIMARY_KEY, direction: 'asc' },
          ],
    },
  };
};
