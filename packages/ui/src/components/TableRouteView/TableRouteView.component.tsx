import type { TablePageResponse } from '#ui/types/ui.types';

import { TableLayout } from '#ui/components/Table/TableLayout';
import { useTableRoutePage } from '#ui/hooks/useTableRoutePage.hook';

import type { TableRouteViewProps } from './TableRouteView.types';

/**
 * What the endpoint can do — seek by cursor, filter server-side — is declared on the
 * loader `meta`, not here, so the loader and the load-more read one declaration (ADR-063).
 * The fetcher is a prop because a function does not survive the loader boundary (ADR-009);
 * the query it receives is composed by `useTableRoutePage`, so a page inherits the view's
 * filters and sort by construction.
 */
export const TableRouteView = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  actions,
  dataErrorSelector = (response) => response.error,
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
      dataErrorSelector={dataErrorSelector}
      dataPromise={dataPromise}
      dataSelector={dataSelector}
      dataTotalSelector={dataTotalSelector}
      metaState={metaState}
      onLoadMore={onLoadMore}
    />
  );
};
