import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';
import type { TableResponseError } from '@lcabrera/ui/components/Table/Table.types';

import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type { SelectOrdersPageArgs } from './enterpriseOrders.service';

import { selectOrderGroupKeyTruncations } from './enterpriseOrders.service';
import { toOrderDrillRead } from './toOrderDrillRead.util';

export type OrdersReadResolution =
  | { readonly error: TableResponseError; readonly kind: 'refused' }
  | { readonly kind: 'read'; readonly read: SelectOrdersPageArgs };

type ResolveOrdersGroupReadArgs = {
  readonly cursor?: readonly unknown[];
  /** The filters the view was read under, already translated. */
  readonly filters: readonly QueryFilter[];
  readonly limit: number;
  /** The request's own params — read only for the group token. */
  readonly params: URLSearchParams;
  readonly skip: number;
  readonly sort: readonly QuerySort[];
};

/**
 * The sentence a refusal renders. Each names the row rather than the request,
 * because a reader clicked a row and a URL is not what they are holding.
 */
const REFUSAL_MESSAGE = {
  'grand-total':
    'A grand total already summarises every row, so there is no narrower set to open.',
  'incomplete-path':
    'This group is named by fewer keys than the view was grouped by, so the rows underneath it are not the rows it counted.',
  malformed: 'This link does not name a group that can be opened.',
  subtotal:
    'A subtotal summarises the groups above it rather than rows of its own.',
} as const;

const toRefusal = (
  reason: keyof typeof REFUSAL_MESSAGE,
): OrdersReadResolution => ({
  error: { kind: 'unexpected', message: REFUSAL_MESSAGE[reason] },
  kind: 'refused',
});

/**
 * The read to run for a request that may name a group — scoped to it when it
 * does, and otherwise the plain paginated read (#870).
 *
 * Both entry points come through here: the modal route's loader, whose filters
 * and sort the table factory already parsed, and `/paginated`, which parses the
 * fetch vocabulary first. That is the whole point of the consolidation — the
 * deleted `/drill` route was a third entry into the same query.
 *
 * **The group travels as a token, not as filters.** Expressing a group's keys
 * as `ColumnFilter`s looks equivalent and is not: a key truncated to a month is
 * a half-open range, and the filter vocabulary's `between` maps to `gte`/`lte`,
 * so the March group would also return an order stamped at midnight on 1 April
 * — a row that is a true fact about the table and wrong under the heading above
 * it. Sending the token keeps `toDrillRead` the one place that rule lives
 * (ADR-082), which is what `/drill` existed to protect.
 *
 * **An unreadable token is refused, never ignored.** `parseDrillGroup` answers
 * `undefined` both for "no group here" and for "a group I cannot read", so the
 * param's *presence* is tested separately. Without that, a mangled link falls
 * through to the unscoped read and serves the whole table under the group's
 * heading.
 *
 * A refusal comes back as data rather than as a status, so the table renders the
 * reason instead of the client throwing on a shape it cannot parse (ADR-068).
 */
export const resolveOrdersGroupRead = async ({
  cursor,
  filters,
  limit,
  params,
  skip,
  sort,
}: ResolveOrdersGroupReadArgs): Promise<OrdersReadResolution> => {
  const isFirstPage = skip === 0;

  if (!params.has(OLAP_DRILL_GROUP_PARAM)) {
    return {
      kind: 'read',
      read: {
        cursor,
        filters,
        includeTotal: isFirstPage,
        limit,
        offset: skip,
        sort,
      },
    };
  }

  const request = parseDrillGroup(params);

  if (request === undefined) return toRefusal('malformed');

  const drill = toOrderDrillRead({
    filters,
    group: request.group,
    groupKeys: request.groupKeys,
    limit,
    sort,
    truncations: await selectOrderGroupKeyTruncations(request.periods),
  });

  if (drill.kind === 'refused') return toRefusal(drill.reason);

  return {
    kind: 'read',
    // `includeTotal` is re-asserted over the translation's `false`: a drill
    // served one bounded page beside a group row that already stated the count,
    // where this read pages and has to say how far it goes.
    read: { ...drill.read, cursor, includeTotal: isFirstPage, offset: skip },
  };
};
