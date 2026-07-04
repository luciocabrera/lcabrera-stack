import type { LoaderFunctionArgs } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { INITIAL_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { wideAlltypes150Api } from '@/services';

import { readTableLoaderStateFromRequest } from '@repo/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';
import {
  COLUMNS,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './WideAlltypes150.constants';

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
  } = readTableLoaderStateFromRequest<WideAlltypes150>({
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });

  const sanitizedSorting = sanitizeSorting<WideAlltypes150>(sorting);

  const dataPromise: Promise<WideAlltypes150Response> =
    wideAlltypes150Api.fetchPaginated({
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
    dataPromise,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    metaState: {
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
