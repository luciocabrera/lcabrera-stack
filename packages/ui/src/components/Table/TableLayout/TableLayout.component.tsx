import * as stylex from '@stylexjs/stylex';

import { Table } from '#ui/components/Table';
import {
  FiltersDataProvider,
  TableCellRenderingProvider,
  TableConfigProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TableOwnStackContext } from '#ui/components/Table/contexts/TableConfig/TableOwnStackContext.context';
import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import { TableSuspenseBoundary } from '#ui/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';
import { useTablePersistence } from './useTablePersistence.hook';

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
  const persistence = useTablePersistence();

  return (
    <TablePersistenceContext value={persistence}>
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
                <TableOwnStackContext value>
                  <TableSuspenseBoundary<TData, TResponse>
                    actions={actions}
                    dataPromise={dataPromise}
                  >
                    {(response) => (
                      <Table<TData, TResponse>
                        actions={actions}
                        columns={columnsState.columns}
                        dataErrorSelector={dataErrorSelector}
                        dataSelector={dataSelector}
                        dataTotalSelector={dataTotalSelector}
                        onLoadMore={onLoadMore}
                        response={response}
                      />
                    )}
                  </TableSuspenseBoundary>
                </TableOwnStackContext>
              </FiltersDataProvider>
            </TableFocusProvider>
          </TableConfigProvider>
        </TableCellRenderingProvider>
      </div>
    </TablePersistenceContext>
  );
};
