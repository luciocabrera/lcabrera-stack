import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isTablePageResponse } from '@lcabrera/api/table-page/is-table-page-response.util';
import { useLoaderData } from 'react-router';

import type { TableRouteLoaderData } from '#ui/routing/loaders/createTableRouteLoader.util';
import type { Pagination, TablePageResponse } from '#ui/types/ui.types';

import { buildTablePageQuery } from '#ui/routing/shared/buildTablePageQuery.util';

type UseTableRoutePageArgs<TResponse> = {
  readonly fetchPage?: (query: PaginatedQuery) => Promise<TResponse>;
};

export const useTableRoutePage = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({ fetchPage }: UseTableRoutePageArgs<TResponse> = {}) => {
  const { columnsState, dataPromise, groupingState, metaState } =
    useLoaderData<TableRouteLoaderData<TData, TResponse>>();

  const { isKeysetEnabled, isServerFilterEnabled, pagePath } = metaState;

  const fetchNextPage =
    fetchPage ??
    (pagePath === undefined
      ? undefined
      : createPaginatedFetcher<TResponse>({
          isValid: (value): value is TResponse => isTablePageResponse(value),
          path: pagePath,
        }));

  const onLoadMore =
    fetchNextPage === undefined
      ? undefined
      : ({ lastRow, limit, skip }: Pagination<TData>) =>
          fetchNextPage(
            buildTablePageQuery<TData>({
              columnsState,
              limit,
              skip,
              ...(isServerFilterEnabled && {
                filter: columnsState.columnFilters,
              }),
              ...(isKeysetEnabled && { lastRow }),
            }),
          );

  return { columnsState, dataPromise, groupingState, metaState, onLoadMore };
};
