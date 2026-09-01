import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';

import { buildPaginatedQueryParams } from '@lcabrera/api/http/build-paginated-query-params.util';
import { fetchAndValidate } from '@lcabrera/api/http/fetch-and-validate.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

const PAGINATED_PATH = '/_api/enterprise-orders/paginated';

export type FetchOrderGroupPageArgs = PaginatedFetchArgs & {
  readonly group: string;
};

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
