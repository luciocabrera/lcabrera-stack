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
>(
  props: TableLayoutProps<TData, TResponse>,
) => {
  const {
    actions,
    cellPalette,
    cellRenderers,
    columnsState,
    groupingState,
    metaState,
  } = props;
  const persistence = useTablePersistence();
  const { columns } = columnsState;
  const table =
    props.dataSelector === undefined ? (
      <TableSuspenseBoundary<TData, readonly TData[]>
        actions={actions}
        dataPromise={props.dataPromise}
      >
        {(rows) => (
          <Table<TData, TResponse>
            actions={actions}
            columns={columns}
            response={rows}
          />
        )}
      </TableSuspenseBoundary>
    ) : (
      <TableSuspenseBoundary<TData, TResponse>
        actions={actions}
        dataPromise={props.dataPromise}
      >
        {(response) => (
          <Table<TData, TResponse>
            actions={actions}
            columns={columns}
            dataErrorSelector={props.dataErrorSelector}
            dataSelector={props.dataSelector}
            dataTotalSelector={props.dataTotalSelector}
            onLoadMore={props.onLoadMore}
            response={response}
          />
        )}
      </TableSuspenseBoundary>
    );

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
                <TableOwnStackContext value>{table}</TableOwnStackContext>
              </FiltersDataProvider>
            </TableFocusProvider>
          </TableConfigProvider>
        </TableCellRenderingProvider>
      </div>
    </TablePersistenceContext>
  );
};
