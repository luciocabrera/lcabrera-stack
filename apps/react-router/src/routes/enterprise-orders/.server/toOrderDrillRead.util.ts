import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';
import type { GroupKeyTruncation } from '@lcabrera/server/db/olap/olap.types';
import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';

import { toDrillRead } from '@lcabrera/server/db/olap/to-drill-read.util';

import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '../config/enterpriseOrders.constants';

type ToOrderDrillReadArgs = {
  /** The filters the grouped view was read under, unchanged. */
  readonly filters: readonly QueryFilter[];
  readonly group: OlapDrillGroup;
  /** The applied group keys, in nesting order. */
  readonly groupKeys: readonly string[];
  readonly limit: number;
  /** The sort the grouped view was read under. */
  readonly sort: readonly QuerySort[];
  /** How each truncated key was derived, by column (#786). */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

/**
 * This route's binding of the generic drill translation (ADR-082).
 *
 * The rules that make a drill correct — inherited filters, `IS NULL` for a NULL
 * key, group-key terms out of the sort, no grouping on the read — are a table
 * feature and live in `@lcabrera/server`. What is genuinely this route's is the
 * pair of constants below: the column it breaks ties on and the ceiling it will
 * serve. Everything else is passed through.
 *
 * The refusal half is re-exported beside it because the resource route may not
 * import `@lcabrera/server/db` itself — that boundary is a lint rule, and this
 * `.server/` module is the door the route already comes through.
 */
export const toOrderDrillRead = (args: ToOrderDrillReadArgs) =>
  toDrillRead({
    ...args,
    maxLimit: MAX_ENTERPRISE_ORDERS_LIMIT,
    primaryKey: ENTERPRISE_ORDER_PRIMARY_KEY,
  });

/**
 * Whether this group row can be drilled at all, asked before anything is
 * resolved (ADR-079, #786).
 *
 * A re-export rather than a second implementation: `toDrillRead` asks the same
 * question through the same function, so the route's early refusal and the
 * translation's cannot come to disagree.
 */
export { resolveDrillRefusal } from '@lcabrera/server/db/olap/resolve-drill-refusal.util';
