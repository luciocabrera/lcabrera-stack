import type { QuerySort } from '@lcabrera/server/db/query-builder/query-builder.types';

import { ENTERPRISE_ORDER_PRIMARY_KEY } from './enterpriseOrders.constants';

export type ToOrderKeysetCursorArgs = {
  readonly cursor?: readonly unknown[];
  readonly sort: readonly QuerySort[];
};

/**
 * The builder throws on one that does not (ADR-052), and a 500 is the wrong answer here:
 * keyset is an optimization, `OFFSET` is the ground truth, and the client sends `skip` on
 * every request either way.
 * So a cursor that cannot be trusted is dropped and the page is served the slow, correct
 * way.
 */
export const toOrderKeysetCursor = ({
  cursor,
  sort,
}: ToOrderKeysetCursorArgs) => {
  if (cursor === undefined) {
    return;
  }

  if (cursor.length !== sort.length) {
    return;
  }

  if (sort.at(-1)?.column !== ENTERPRISE_ORDER_PRIMARY_KEY) {
    return;
  }

  const orderId = cursor.at(-1);

  if (orderId === null || orderId === undefined) {
    return;
  }

  return { uniqueColumn: ENTERPRISE_ORDER_PRIMARY_KEY, values: cursor };
};
