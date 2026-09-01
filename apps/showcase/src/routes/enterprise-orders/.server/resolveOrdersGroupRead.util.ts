import { resolveGroupRead } from '@lcabrera/server/db/olap/resolve-group-read.util';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config/enterpriseOrders.constants';
import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';

type ResolveOrdersGroupReadArgs = Omit<
  Parameters<typeof resolveGroupRead>[0],
  'maxLimit' | 'primaryKey' | 'selectTruncations'
>;

export const resolveOrdersGroupRead = (args: ResolveOrdersGroupReadArgs) =>
  resolveGroupRead({
    ...args,
    maxLimit: MAX_ENTERPRISE_ORDERS_LIMIT,
    primaryKey: ENTERPRISE_ORDER_PRIMARY_KEY,
    selectTruncations: selectOrderGroupKeyTruncations,
  });
