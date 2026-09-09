/**
 * The rows this rung renders from, built in the module rather than read from a
 * store: the point being demonstrated is that the table needs rows and columns
 * and nothing else. A later rung replaces the loader behind the same route with
 * one that reads them from a database, and this file goes with it.
 */

import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type { Order } from './orders.types';

const CUSTOMERS = [
  'Aurora Freight',
  'Bramble & Co',
  'Cobalt Logistics',
  'Dunmore Supply',
  'Everline Retail',
] as const;

const STATUSES = ['delivered', 'pending', 'shipped'] as const;

const ROW_COUNT = 120;

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
  { length: ROW_COUNT },
  (_unused, index) => buildOrder(index),
);
