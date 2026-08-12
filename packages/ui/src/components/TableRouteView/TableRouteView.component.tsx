import type { TablePageResponse } from '#ui/types/ui.types';

import { TableLayout } from '#ui/components/Table/TableLayout';
import { useTableRoutePage } from '#ui/hooks/useTableRoutePage.hook';

import type { TableRouteViewProps } from './TableRouteView.types';

/**
 * A whole table route's view: loader data in, paginated table out.
 *
 * The view-side counterpart to `createTableRouteLoader`. Between the two, a
 * table route declares its columns, its loader and its fetcher, and writes no
 * fetch plumbing, no sort composition and no table JSX.
 *
 * A route whose response is not `{ data, hasMore?, total? }`, or that needs its
 * own JSX around the table, composes `useTableRoutePage` with `TableLayout`
 * directly instead.
 *
 * What the endpoint can do — seek by cursor, filter server-side — is declared on
 * the loader `meta`, not here, so the loader and the load-more read one
 * declaration (ADR-063). The props this component does take are the pieces only
 * the component can supply: a fetcher, a toolbar node and two selectors.
 */
export const TableRouteView = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  actions,
  dataSelector = (response) => response.data,
  dataTotalSelector = (response) => response.total,
  fetchPage,
}: TableRouteViewProps<TData, TResponse>) => {
  const { columnsState, dataPromise, metaState, onLoadMore } =
    useTableRoutePage<TData, TResponse>({ fetchPage });

  return (
    <TableLayout<TData, TResponse>
      actions={actions}
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={dataSelector}
      dataTotalSelector={dataTotalSelector}
      metaState={metaState}
      onLoadMore={onLoadMore}
    />
  );
};
