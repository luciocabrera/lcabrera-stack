import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { appendPrimaryKeySorting } from '@lcabrera/ui/routing/appendPrimaryKeySorting.util';
import { readTableLoaderStateFromRequest } from '@lcabrera/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/sanitizeSorting.util';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { wideAlltypes150Api } from '@/services';

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
    metaUiFlags,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<WideAlltypes150>({
    appId: APP_ID,
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
      sorting: appendPrimaryKeySorting<WideAlltypes150>({
        columns: COLUMNS,
        sorting: sanitizedSorting,
      }),
    });

  return {
    // COLUMNS is fully serializable (no functions), so the loader can
    // return it directly. No distinct descriptors here yet — this route's
    // filter support is deliberately minimal (see its ARCHITECTURE.md).
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
      ...metaUiFlags,
      appId: APP_ID,
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
