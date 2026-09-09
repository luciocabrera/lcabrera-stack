/**
 * The rows this rung renders from, built in the module rather than read from a
 * store: the point being demonstrated is that the table needs rows and columns
 * and nothing else. There is nothing behind the route to ask for a second page,
 * so the set is built to the size of the one page the loader reads — the total
 * the table reports is then the total it can show. A later rung replaces the
 * loader with one that reads from a database, and this file goes with it.
 */

import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type { Order } from './orders.types';

import { PAGE_LIMIT } from './Orders.constants';

const CUSTOMERS = [
  'Aurora Freight',
  'Bramble & Co',
  'Cobalt Logistics',
  'Dunmore Supply',
  'Everline Retail',
] as const;

const STATUSES = ['delivered', 'pending', 'shipped'] as const;

const FIRST_ORDER_ID = 1000;

const DAY_IN_MILLISECONDS = 86_400_000;

const FIRST_ORDERED_ON = Date.UTC(2026, 0, 1);

const buildOrder = (index: number) => {
  const quantity = 1 + (index % 9);
  const unitPrice = roundToCents(19.5 + (index % 37) * 3.25);

  return {
    customer: CUSTOMERS[index % CUSTOMERS.length] ?? CUSTOMERS[0],
    orderedOn: new Date(
      FIRST_ORDERED_ON + index * DAY_IN_MILLISECONDS,
    ).toISOString(),
    orderId: FIRST_ORDER_ID + index,
    quantity,
    status: STATUSES[index % STATUSES.length] ?? STATUSES[0],
    total: roundToCents(quantity * unitPrice),
    unitPrice,
  } satisfies Order;
};

export const ORDER_ROWS: readonly Order[] = Array.from(
  { length: PAGE_LIMIT },
  (_unused, index) => buildOrder(index),
);
