import type { TablePageResponse } from '@lcabrera/ui/types/ui.types';

import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { useTableRoutePage } from '@lcabrera/ui/hooks/useTableRoutePage.hook';

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
 */
export const TableRouteView = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  actions,
  dataSelector = (response) => response.data,
  dataTotalSelector = (response) => response.total,
  fetchPage,
  isKeysetEnabled,
  isServerFilterEnabled,
}: TableRouteViewProps<TData, TResponse>) => {
  const { columnsState, dataPromise, metaState, onLoadMore } =
    useTableRoutePage<TData, TResponse>({
      fetchPage,
      isKeysetEnabled,
      isServerFilterEnabled,
    });

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
