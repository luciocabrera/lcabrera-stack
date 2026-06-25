import * as stylex from '@stylexjs/stylex';

import { Table } from '@/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
} from '@/components/Table/contexts';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
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
          <TableSuspenseBoundary<TData, TResponse> dataPromise={dataPromise}>
            {(response) => (
              <Table<TData, TResponse>
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
