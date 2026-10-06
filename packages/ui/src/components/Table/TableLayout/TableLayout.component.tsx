import * as stylex from '@stylexjs/stylex';

import { Table } from '#ui/components/Table';
import {
  FiltersDataProvider,
  TableCellRenderingProvider,
  TableConfigProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TableSuspenseBoundary } from '#ui/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';
import { useRetainTablePersistFetchers } from './useRetainTablePersistFetchers.hook';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  actions,
  cellPalette,
  cellRenderers,
  columnsState,
  dataErrorSelector,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  groupingState,
  metaState,
  onLoadMore,
}: TableLayoutProps<TData, TResponse>) => {
  useRetainTablePersistFetchers();

  return (
    <div {...stylex.props(styles.container)}>
      <TableCellRenderingProvider
        cellPalettes={[columnsState.cellPalette, cellPalette]}
        cellRenderers={cellRenderers}
      >
        <TableConfigProvider<TData>
          columnsState={columnsState}
          groupingState={groupingState}
          metaState={metaState}
        >
          <TableFocusProvider>
            <FiltersDataProvider<TData> columns={columnsState.columns}>
              <TableSuspenseBoundary<TData, TResponse>
                actions={actions}
                dataPromise={dataPromise}
              >
                {(response) => (
                  <Table<TData, TResponse>
                    actions={actions}
                    dataErrorSelector={dataErrorSelector}
                    dataSelector={dataSelector}
                    dataTotalSelector={dataTotalSelector}
                    onLoadMore={onLoadMore}
                    response={response}
                  />
                )}
              </TableSuspenseBoundary>
            </FiltersDataProvider>
          </TableFocusProvider>
        </TableConfigProvider>
      </TableCellRenderingProvider>
    </div>
  );
};
