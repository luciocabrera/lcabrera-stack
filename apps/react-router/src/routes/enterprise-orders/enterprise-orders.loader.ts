import type { LoaderFunctionArgs } from 'react-router';

import { toQueryFilters } from '@repo/data-access/filters/toQueryFilters.util';
import { INITIAL_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { appendDistinctFilterDescriptors } from '@repo/ui/routing/appendDistinctFilterDescriptors.util';
import { appendPrimaryKeySorting } from '@repo/ui/routing/appendPrimaryKeySorting.util';
import { readTableLoaderStateFromRequest } from '@repo/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';

import { APP_ID } from '@/constants/app.constants';

import type { EnterpriseOrder } from './config';

import { toOrderQuerySort } from './config';
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
import { selectOrdersPage } from './server/enterpriseOrders.service';

/**
 * Loader for enterprise orders route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  // Columns are serializable (descriptors, never functions — see
  // .claude/rules/routes-data.md), so the loader can return them directly.
  const columns = appendDistinctFilterDescriptors({
    columns: COLUMNS,
    schemaName: SCHEMA_NAME,
    tableName: TABLE_NAME,
    transport: 'bff',
  });

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

  // Return the promise directly (not awaited) for Suspense streaming. The
  // generic executors read Postgres server-side — no api-server round-trip.
  const enterpriseOrdersPromise = selectOrdersPage({
    filters: toQueryFilters({ filters }),
    limit: INITIAL_PAGE_SIZE,
    offset: 0,
    sort: toOrderQuerySort({ sorting: effectiveSorting }),
  });

  return {
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns,
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
