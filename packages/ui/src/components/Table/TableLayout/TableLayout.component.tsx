import { Table } from '@lcabrera/ui/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
} from '@lcabrera/ui/components/Table/contexts';
import { TableSuspenseBoundary } from '@lcabrera/ui/components/Table/TableSuspenseBoundary';
import * as stylex from '@stylexjs/stylex';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  actions,
  columnsState,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  metaState,
  onLoadMore,
}: TableLayoutProps<TData, TResponse>) => {
  return (
    <div {...stylex.props(styles.container)}>
      <TableConfigProvider<TData>
        columnsState={columnsState}
        metaState={metaState}
      >
        <FiltersDataProvider<TData> columns={columnsState.columns}>
          <TableSuspenseBoundary<TData, TResponse>
            actions={actions}
            dataPromise={dataPromise}
          >
            {(response) => (
              <Table<TData, TResponse>
                actions={actions}
                dataSelector={dataSelector}
                dataTotalSelector={dataTotalSelector}
                onLoadMore={onLoadMore}
                response={response}
              />
            )}
          </TableSuspenseBoundary>
        </FiltersDataProvider>
      </TableConfigProvider>
    </div>
  );
};
