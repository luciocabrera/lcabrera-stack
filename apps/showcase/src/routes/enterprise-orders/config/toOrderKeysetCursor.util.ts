import type { QuerySort } from '@lcabrera/server/db/query-builder/query-builder.types';

import { ENTERPRISE_ORDER_PRIMARY_KEY } from './enterpriseOrders.constants';

export type ToOrderKeysetCursorArgs = {
  readonly cursor?: readonly unknown[];
  readonly sort: readonly QuerySort[];
};

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
