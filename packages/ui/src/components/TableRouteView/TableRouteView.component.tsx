import type { TablePageResponse } from '#ui/types/ui.types';

import { TableLayout } from '#ui/components/Table/TableLayout';
import { useTableRoutePage } from '#ui/hooks/useTableRoutePage.hook';

import type { TableRouteViewProps } from './TableRouteView.types';

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
