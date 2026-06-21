import type { LoaderFunctionArgs } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { readPersistedUiStateFromSessionStorage } from '@/components/Table/utils';
import { readPersistedStateFromSessionStorage } from '@/components/Table/utils/readPersistedStateFromSessionStorage.util';
import { enterpriseOrdersApi } from '@/services';

import type { Route } from './+types/root';

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

    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
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
    columnOrder,
    columns: COLUMNS,

    columnSizing,
    columnVisibility,
    defaultColumnPinning: DEFAULT_COLUMN_PINNING,
    enterpriseOrdersPromise,
    filters,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    persistenceKey: PERSISTENCE_KEY,
    schemaName: SCHEMA_NAME,
    sorting: sanitizedSorting,
    tableName: TABLE_NAME,
    title: TITLE,
  };
};
export const clientLoader = async ({
  serverLoader,
}: Route.ClientLoaderArgs) => {
  const serverData = await serverLoader();
  const { persistenceKey } = serverData;

  const columnState = readPersistedStateFromSessionStorage({
    persistenceKey,
  });
  const uiState = readPersistedUiStateFromSessionStorage({ persistenceKey });

  console.log('Client loader - read persisted state from sessionStorage', {
    columnState,
    serverData,
    uiState,
  });

  return { ...serverData, columnState, uiState };
};

// force the client loader to run during hydration
clientLoader.hydrate = true as const; // `as const` for type inference
