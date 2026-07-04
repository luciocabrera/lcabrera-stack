import type { LoaderFunctionArgs } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { enterpriseOrdersApi } from '@/services';

import { readTableLoaderStateFromRequest } from '@repo/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';
import {
  COLUMNS,
  DEFAULT_COLUMN_PINNING,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './EnterpriseOrders.constants';

/**
 * Loader for enterprise orders route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const {
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    filters,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<EnterpriseOrder>({
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sanitizeSorting<EnterpriseOrder>(sorting);

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<EnterpriseOrdersResponse> =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: sanitizedSorting,
    });

  return {
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns: COLUMNS,
      columnSizing,
      columnVisibility,
      sorting: sanitizedSorting,
    },
    defaultColumnPinning: DEFAULT_COLUMN_PINNING,
    enterpriseOrdersPromise,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    metaState: {
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
