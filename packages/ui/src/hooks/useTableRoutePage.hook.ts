import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { useLoaderData } from 'react-router';

import type { TableRouteLoaderData } from '#ui/routing/loaders/createTableRouteLoader.util';
import type { Pagination, TablePageResponse } from '#ui/types/ui.types';

import { buildTablePageQuery } from '#ui/routing/shared/buildTablePageQuery.util';

type UseTableRoutePageArgs<TResponse> = {
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
};

export const useTableRoutePage = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  fetchPage,
}: UseTableRoutePageArgs<TResponse>) => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<TableRouteLoaderData<TData, TResponse>>();

  const { isKeysetEnabled, isServerFilterEnabled } = metaState;

  const onLoadMore = async ({ lastRow, limit, skip }: Pagination<TData>) =>
    fetchPage(
      buildTablePageQuery<TData>({
        columnsState,
        limit,
        skip,
        ...(isServerFilterEnabled && { filter: columnsState.columnFilters }),
        ...(isKeysetEnabled && { lastRow }),
      }),
    );

  return { columnsState, dataPromise, metaState, onLoadMore };
};
