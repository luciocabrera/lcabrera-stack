import type { LoaderFunctionArgs } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { wideAlltypes150Api } from '@/services';

import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';
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

  const sanitizedSorting = sorting.filter(
    (s): s is { columnKey: keyof WideAlltypes150; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );

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
