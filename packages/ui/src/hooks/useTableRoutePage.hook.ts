import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { useLoaderData } from 'react-router';

import type { TableRouteLoaderData } from '#ui/routing/loaders/createTableRouteLoader.util';
import type { Pagination, TablePageResponse } from '#ui/types/ui.types';

import { buildTablePageQuery } from '#ui/routing/shared/buildTablePageQuery.util';

type UseTableRoutePageArgs<TResponse> = {
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
};

/**
 * The two request-shaping capabilities are read from the loader's `metaState`, never
 * passed in: a capability describes the endpoint, and the route's loader is where the
 * endpoint is declared (ADR-063).
 */
export const useTableRoutePage = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  fetchPage,
}: UseTableRoutePageArgs<TResponse>) => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<TableRouteLoaderData<TData, TResponse>>();

  // Absent means off: a falsy capability contributes no key to the query below,
  // so a route that declares no capability meta sends exactly what one
  // declaring both `false` sends, and adopting this hook cannot change a
  // route's request shape by accident (ADR-056 §4, carried over by ADR-063).
  // `createTableRouteLoader` resolves both from the route's `meta` alone, so
  // neither can be switched on by the persisted UI-flags cookie.
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
