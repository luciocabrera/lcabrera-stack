import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';

import { buildPaginatedQueryParams } from '@lcabrera/api/http/build-paginated-query-params.util';
import { fetchAndValidate } from '@lcabrera/api/http/fetch-and-validate.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

const PAGINATED_PATH = '/_api/enterprise-orders/paginated';

export type FetchOrderGroupPageArgs = PaginatedFetchArgs & {
  /**
   * The `group` token the modal was opened with, forwarded **verbatim**. The
   * modal reads it from its own URL and never rebuilds it, so the request the
   * server parses is the one the link named.
   */
  readonly group: string;
};

/**
 * The group-details modal's load-more: a page of one group's rows from the same
 * paginated endpoint the list uses (#870).
 *
 * **It composes the two HTTP primitives rather than going through
 * `createPaginatedFetcher`**, which builds its query from a fixed parameter set
 * and has no seam for the group token. Widening the published factory for one
 * route's extra param would put a route-specific concern in `@lcabrera/api`;
 * composing `buildPaginatedQueryParams` with `fetchAndValidate` reuses
 * everything the factory would have and adds only the parameter this call has.
 *
 * Unlike the drill fetcher it replaces, this one **does** take `skip` and
 * `cursor`: a group opens as a table that pages, which is the whole point of
 * the modal.
 */
export const fetchOrderGroupPage = ({
  cursor,
  filter,
  group,
  limit,
  signal,
  skip,
  sorting,
  timeoutMs,
}: FetchOrderGroupPageArgs) => {
  const params = buildPaginatedQueryParams({
    cursor,
    filter,
    limit,
    skip,
    sorting,
  });

  params.set(OLAP_DRILL_GROUP_PARAM, group);

  return fetchAndValidate<EnterpriseOrdersResponse>({
    isValid: isEnterpriseOrdersResponse,
    shapeErrorMessage: `Unexpected response shape from ${PAGINATED_PATH}`,
    signal,
    timeoutMs,
    url: `${PAGINATED_PATH}?${params.toString()}`,
  });
};
