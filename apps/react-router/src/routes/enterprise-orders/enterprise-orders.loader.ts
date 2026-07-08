import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { appendPrimaryKeySorting } from '@repo/ui/routing/appendPrimaryKeySorting.util';
import { readTableLoaderStateFromRequest } from '@repo/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { enterpriseOrdersApi } from '@/services';

import {
  COLUMNS,
  CRUD,
  DEFAULT_COLUMN_PINNING,
  DELETE_ACTION_PATH,
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
    metaUiFlags,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<EnterpriseOrder>({
    appId: APP_ID,
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sanitizeSorting<EnterpriseOrder>(sorting);
  // Always append the primary-key column(s) so server pagination has a stable
  // ordering. The store keeps only the user's sorting (sanitizedSorting).
  const effectiveSorting = appendPrimaryKeySorting<EnterpriseOrder>({
    columns: COLUMNS,
    sorting: sanitizedSorting,
  });

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<EnterpriseOrdersResponse> =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: effectiveSorting,
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
      ...metaUiFlags,
      appId: APP_ID,
      crud: CRUD,
      deleteActionPath: DELETE_ACTION_PATH,
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
