import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';
import type { TableGroupRowSummary } from '@lcabrera/ui/components/Table/Table.types';

import { buildPaginatedQueryParams } from '@lcabrera/api/http/build-paginated-query-params.util';
import { fetchAndValidate } from '@lcabrera/api/http/fetch-and-validate.util';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

const DRILL_PATH = '/_api/enterprise-orders/drill';

export type FetchOrderDrillArgs = Omit<
  PaginatedFetchArgs,
  'cursor' | 'skip'
> & {
  /** The applied group keys, in nesting order — what "complete" is measured against. */
  readonly groupKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

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
 * Only `columnKey` and `value` of each path entry are sent. `label` is a
 * formatted display string; what a drill is built from is the raw value, and
 * shipping the label would invite a filter built from the wrong one.
 */
export const fetchOrderDrill = ({
  filter,
  groupKeys,
  limit,
  signal,
  sorting,
  summary,
  timeoutMs,
}: FetchOrderDrillArgs) => {
  // `skip: 0` because a drill reads from the start of its group and never pages
  // again. `toOrderDrillRead` forces `offset: 0` server-side regardless, so this
  // is the honest value rather than a load-bearing one.
  const params = buildPaginatedQueryParams({ filter, limit, skip: 0, sorting });

  params.set(
    'group',
    JSON.stringify({
      isSubtotal: summary.isSubtotal,
      keys: groupKeys,
      path: summary.path.map(({ columnKey, value }) => ({ columnKey, value })),
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
