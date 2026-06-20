import type { LoaderFunctionArgs } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { enterpriseOrdersApi } from '@/services';

import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';
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
    columnSizing,
    columnVisibility,
    filters,
    standaloneFiltersParam,
    standaloneSortParam,
    sorting,
  } = readTableLoaderStateFromRequest<EnterpriseOrder>({
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sorting.filter(
    (s): s is { columnKey: keyof EnterpriseOrder; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );

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
    sorting: sanitizedSorting,
    columns: COLUMNS,
    columnOrder,
    columnSizing,
    columnVisibility,
    enterpriseOrdersPromise,
    filters,
    schemaName: SCHEMA_NAME,
    title: TITLE,
    tableName: TABLE_NAME,
    persistenceKey: PERSISTENCE_KEY,
    defaultColumnPinning: DEFAULT_COLUMN_PINNING,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
  };
};
