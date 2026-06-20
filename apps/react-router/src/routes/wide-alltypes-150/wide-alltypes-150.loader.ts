import type { LoaderFunctionArgs } from 'react-router';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { wideAlltypes150Api } from '@/services';

import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';
import { PERSISTENCE_KEY } from './WideAlltypes150.constants';

export const loader = ({ request }: LoaderFunctionArgs) => {
  const {
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<WideAlltypes150>({
    persistenceKey: PERSISTENCE_KEY,
    request,
  });

  const filteredSorting = sorting.filter(
    (s): s is { columnKey: keyof WideAlltypes150; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );

  const dataPromise: Promise<WideAlltypes150Response> =
    wideAlltypes150Api.fetchPaginated({
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: filteredSorting,
    });

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    dataPromise,
    key: standaloneSortParam ?? '',
    sorting: filteredSorting,
  };
};
