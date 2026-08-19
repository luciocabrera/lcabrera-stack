import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { useLoaderData } from 'react-router';

import type { TableGroupDrillRequest } from '#ui/components/Table';
import type { TableRouteLoaderData } from '#ui/routing/loaders/createTableRouteLoader.util';
import type { Pagination, TablePageResponse } from '#ui/types/ui.types';

import { INITIAL_PAGE_SIZE } from '#ui/components/Table/Table.constants';
import { buildTablePageQuery } from '#ui/routing/shared/buildTablePageQuery.util';

type UseTableRoutePageArgs<TResponse> = {
  /**
   * The route's drilled read (ADR-079). Optional: a route without a drill
   * endpoint supplies none, and the table then offers no affordance whatever
   * `isGroupDrillEnabled` says.
   *
   * It takes the same query shape `fetchPage` does, plus the group — so a drill
   * inherits the view's filters and sort by construction rather than by the
   * route remembering to forward them, which is the failure that returns rows
   * that are individually true and wrong under the heading above them.
   */
  readonly fetchDrill?: (
    query: PaginatedQuery & TableGroupDrillRequest,
  ) => Promise<TResponse>;
  /**
   * The route's paginated read — typically a `createPaginatedFetcher` result.
   * It takes the query this hook builds, so the two halves are type-checked
   * against each other rather than agreeing by convention.
   */
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
};

/**
 * Wire a table route's loader data to its load-more fetch — the view-side
 * counterpart to `createTableRouteLoader`.
 *
 * Returns the four props `TableLayout` needs, so a route that wants custom JSX
 * around the table can spread them; a route that does not should render
 * `TableRouteView`, which is this hook plus the default selectors.
 *
 * The two request-shaping capabilities are read from the loader's `metaState`,
 * never passed in: a capability describes the endpoint, and the route's loader
 * is where the endpoint is declared (ADR-063). That puts the flag where both
 * halves of the route can reach it — though the loader does not itself act on
 * it today, so what the first page sends is still up to its own `fetchPage`.
 */
export const useTableRoutePage = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  fetchDrill,
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

  // Built here rather than by the route for the reason `onLoadMore` is: the
  // filters and sort a drill has to inherit are the ones this hook already
  // composes, and a second composition beside it is a second place for them to
  // drift (ADR-079). `limit` is the page size the route was read at — a drill
  // fetches one bounded page and the hand-off covers the rest.
  const onDrillGroup =
    fetchDrill === undefined
      ? undefined
      : async ({ groupingKeys, path }: TableGroupDrillRequest) => {
          const response = await fetchDrill({
            ...buildTablePageQuery<TData>({
              columnsState,
              limit: metaState.initialPageSize ?? INITIAL_PAGE_SIZE,
              skip: 0,
              ...(isServerFilterEnabled && {
                filter: columnsState.columnFilters,
              }),
            }),
            groupingKeys,
            path,
          });

          return response.data;
        };

  return { columnsState, dataPromise, metaState, onDrillGroup, onLoadMore };
};
