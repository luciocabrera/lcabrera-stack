import type { LoaderFunctionArgs } from 'react-router';

import type { SortingState } from '@/components/Table';
import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { wideAlltypes150Api } from '@/services';
import { deserializeSortingFromURL } from '@/utils/urlState';

import { FETCH_SIZE } from './WideAlltypes150TanStack.constants';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const standaloneSortParam = url.searchParams.get('sort');
  let sorting: SortingState<WideAlltypes150> = [];

  if (standaloneSortParam) {
    sorting = deserializeSortingFromURL<WideAlltypes150>(standaloneSortParam);
  }

  const filteredSorting = sorting.filter(
    (
      sortRule,
    ): sortRule is {
      columnKey: keyof WideAlltypes150;
      direction: 'asc' | 'desc';
    } => sortRule.direction !== undefined && sortRule.columnKey !== 'actions',
  );

  const initialPage: WideAlltypes150Response =
    await wideAlltypes150Api.fetchPaginated({
      limit: FETCH_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: filteredSorting,
    });

  return {
    initialPage,
    initialSortParam: standaloneSortParam ?? '',
    sorting: filteredSorting,
  };
};
