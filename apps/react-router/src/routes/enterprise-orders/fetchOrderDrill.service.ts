import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';
import type { TableGroupDrillRequest } from '@lcabrera/ui/components/Table';

import { buildPaginatedQueryParams } from '@lcabrera/api/http/build-paginated-query-params.util';
import { fetchAndValidate } from '@lcabrera/api/http/fetch-and-validate.util';
import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

const DRILL_PATH = '/_api/enterprise-orders/drill';

export type FetchOrderDrillArgs = Omit<PaginatedFetchArgs, 'cursor' | 'skip'> &
  TableGroupDrillRequest;

/**
 * Fetches one bounded page of the rows underneath a group row
 * ([ADR-079](../../docs/decisions/ADR-079-drilling-from-a-group-to-its-rows.md)).
 *
 * **It composes the two HTTP primitives rather than going through
 * `createPaginatedFetcher`**, which builds its query from a fixed parameter set
 * and has no seam for the group descriptor. Widening the published factory for
 * one route's extra param would put a route-specific concern in
 * `@lcabrera/api`; composing `buildPaginatedQueryParams` with
 * `fetchAndValidate` reuses everything the factory would have and adds only the
 * parameter this endpoint actually has.
 *
 * **`cursor` and `skip` are absent from the arguments on purpose.** A drill
 * fetches one page and never pages again (ADR-079), so an offset or a cursor
 * would be a parameter with no second call to use it — and accepting one would
 * advertise a second page this contract does not have.
 *
 * **The group descriptor is encoded by `@lcabrera/api`, not here.** Its parser
 * is the other half of one codec, and a request written by hand beside a reader
 * written elsewhere is behaviour duplicated rather than a shape (ADR-082) —
 * which is how the `undefined`-valued key that JSON silently drops went
 * unnoticed. Dropping the display `label` is part of that contract: what a
 * drill is built from is the raw value.
 */
export const fetchOrderDrill = ({
  filter,
  groupingKeys,
  limit,
  path,
  signal,
  sorting,
  timeoutMs,
}: FetchOrderDrillArgs) => {
  // `skip: 0` because a drill reads from the start of its group and never pages
  // again. `toOrderDrillRead` forces `offset: 0` server-side regardless, so this
  // is the honest value rather than a load-bearing one.
  const params = buildPaginatedQueryParams({ filter, limit, skip: 0, sorting });

  params.set(
    OLAP_DRILL_GROUP_PARAM,
    // `isSubtotal: false` is a statement, not a default: only a complete,
    // non-subtotal grouping set is drillable, so a request that reaches here is
    // never one. The server refuses a subtotal anyway, which is what makes this
    // safe to state rather than to carry.
    encodeDrillGroup({
      group: { isSubtotal: false, path },
      groupKeys: groupingKeys,
    }),
  );

  return fetchAndValidate<EnterpriseOrdersResponse>({
    isValid: isEnterpriseOrdersResponse,
    shapeErrorMessage: `Unexpected response shape from ${DRILL_PATH}`,
    signal,
    timeoutMs,
    url: `${DRILL_PATH}?${params.toString()}`,
  });
};
