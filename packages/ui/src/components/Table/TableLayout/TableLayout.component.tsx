import * as stylex from '@stylexjs/stylex';

import { Table } from '#ui/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TableSuspenseBoundary } from '#ui/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  actions,
  columnsState,
  dataErrorSelector,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  metaState,
  onDrillGroup,
  onLoadMore,
}: TableLayoutProps<TData, TResponse>) => {
  return (
    <div {...stylex.props(styles.container)}>
      <TableConfigProvider<TData>
        columnsState={columnsState}
        metaState={metaState}
        onDrillGroup={onDrillGroup}
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
    </div>
  );
};
