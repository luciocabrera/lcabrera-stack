import type { OlapGroupReadResolution } from '@lcabrera/server/db/olap/olap.types';

import { resolveGroupRead } from '@lcabrera/server/db/olap/resolve-group-read.util';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config/enterpriseOrders.constants';
import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

export type OrdersReadResolution = OlapGroupReadResolution;

type ResolveOrdersGroupReadArgs = Omit<
  Parameters<typeof resolveGroupRead>[0],
  'maxLimit' | 'primaryKey' | 'selectTruncations'
>;

/** This route's binding of the generic group read (ADR-082, ADR-087). */
export const resolveOrdersGroupRead = (args: ResolveOrdersGroupReadArgs) =>
  resolveGroupRead({
    ...args,
    maxLimit: MAX_ENTERPRISE_ORDERS_LIMIT,
    primaryKey: ENTERPRISE_ORDER_PRIMARY_KEY,
    selectTruncations: selectOrderGroupKeyTruncations,
  });
