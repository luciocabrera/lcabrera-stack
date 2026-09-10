/**
 * The page contract the route reads through, taking the published query shape
 * so that swapping this implementation for a database-backed one later is a
 * change of body and not of signature.
 */

import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import type { OrdersPage } from './orders.types';

import { ORDER_ROWS } from './orders.rows';

export const readOrdersPage = ({ limit, skip }: PaginatedQuery) => {
  const data = ORDER_ROWS.slice(skip, skip + limit);

  return Promise.resolve({
    data,
    hasMore: skip + data.length < ORDER_ROWS.length,
    total: ORDER_ROWS.length,
  } satisfies OrdersPage);
};
