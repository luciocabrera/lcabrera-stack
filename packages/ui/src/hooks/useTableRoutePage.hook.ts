import type { PaginatedQuery } from '@lcabrera/api/http/http.types';
import type { TableRouteLoaderData } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';
import type { Pagination } from '@lcabrera/ui/types/ui.types';

import { buildTablePageQuery } from '@lcabrera/ui/routing/shared/buildTablePageQuery.util';
import { useLoaderData } from 'react-router';

type UseTableRoutePageArgs<TResponse> = {
  /**
   * The route's paginated read — typically a `createPaginatedFetcher` result.
   * It takes the query this hook builds, so the two halves are type-checked
   * against each other rather than agreeing by convention.
   */
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
  /**
   * Send the last loaded row as a keyset cursor (ADR-052). Off by default:
   * an endpoint that cannot seek would receive a parameter it ignores.
   */
  readonly isKeysetEnabled?: boolean;
  /**
   * Send the table's column filters with each page. Off by default: an endpoint
   * that does not filter server-side would append unfiltered rows to a filtered
   * table.
   */
  readonly isServerFilterEnabled?: boolean;
};

/**
 * Wire a table route's loader data to its load-more fetch — the view-side
 * counterpart to `createTableRouteLoader`.
 *
 * Returns the four props `TableLayout` needs, so a route that wants custom JSX
 * around the table can spread them; a route that does not should render
 * `TableRouteView`, which is this hook plus the default selectors.
 */
export const useTableRoutePage = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  fetchPage,
  isKeysetEnabled = false,
  isServerFilterEnabled = false,
}: UseTableRoutePageArgs<TResponse>) => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<TableRouteLoaderData<TData, TResponse>>();

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
