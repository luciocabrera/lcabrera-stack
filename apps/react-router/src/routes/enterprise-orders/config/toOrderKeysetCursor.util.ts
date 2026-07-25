import type {
  QueryCursor,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';

import { ENTERPRISE_ORDER_PRIMARY_KEY } from './enterpriseOrders.constants';

export type ToOrderKeysetCursorArgs = {
  readonly cursor?: readonly unknown[];
  readonly sort: readonly QuerySort[];
};

/**
 * The `QueryCursor` to seek with, or `undefined` to fall back to `OFFSET`.
 *
 * The cursor values arrive from the browser, and the sort is whatever the user
 * built in the table — neither is guaranteed to describe a total order. The
 * builder throws on one that does not (ADR-052), and a 500 is the wrong answer
 * here: keyset is an optimization, `OFFSET` is the ground truth, and the client
 * sends `skip` on every request either way. So a cursor that cannot be trusted
 * is dropped and the page is served the slow, correct way.
 *
 * The one case that is not hypothetical: sorting by `order_id` **and then**
 * another column leaves the primary key mid-sort, so `appendPrimaryKeySorting`
 * adds nothing and the sort does not end on a unique column.
 */
export const toOrderKeysetCursor = ({
  cursor,
  sort,
}: ToOrderKeysetCursorArgs): QueryCursor | undefined => {
  if (cursor === undefined || cursor.length !== sort.length) {
    return undefined;
  }

  if (sort.at(-1)?.column !== ENTERPRISE_ORDER_PRIMARY_KEY) {
    return undefined;
  }

  const orderId = cursor.at(-1);

  if (orderId === null || orderId === undefined) {
    return undefined;
  }

  return { uniqueColumn: ENTERPRISE_ORDER_PRIMARY_KEY, values: cursor };
};
