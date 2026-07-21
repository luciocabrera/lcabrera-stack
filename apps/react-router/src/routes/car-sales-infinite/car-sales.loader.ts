import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { appendDistinctFilterDescriptors } from '@lcabrera/ui/routing/appendDistinctFilterDescriptors.util';
import { appendPrimaryKeySorting } from '@lcabrera/ui/routing/appendPrimaryKeySorting.util';
import { readTableLoaderStateFromRequest } from '@lcabrera/ui/routing/readTableLoaderStateFromRequest.util';

import type { CarSale, CarSalesResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { carSalesApi } from '@/services';

import { COLUMNS } from '../car-sales/CarSales.constants';
import {
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './CarSales.constants';

export const loader = ({ request }: LoaderFunctionArgs) => {
  // Columns are serializable (descriptors, never functions — see
  // .claude/rules/routes-data.md), so the loader can return them directly.
  const columns = appendDistinctFilterDescriptors({
    columns: COLUMNS,
    schemaName: SCHEMA_NAME,
    tableName: TABLE_NAME,
    transport: 'loader',
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
  } = readTableLoaderStateFromRequest<CarSale>({
    appId: APP_ID,
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const isValidSortEntry = (
    s: (typeof sorting)[number],
  ): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
    s.direction !== undefined && s.columnKey !== 'actions';

  const sanitizedSorting = sorting.filter(isValidSortEntry);

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse & { hasMore: boolean }> =
    carSalesApi.fetchCarSalesPaginated({
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: appendPrimaryKeySorting<CarSale>({
        columns: COLUMNS,
        sorting: sanitizedSorting,
      }),
    });

  return {
    carSalesPromise,
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      sorting: sanitizedSorting,
    },
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    metaState: {
      ...metaUiFlags,
      appId: APP_ID,
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
