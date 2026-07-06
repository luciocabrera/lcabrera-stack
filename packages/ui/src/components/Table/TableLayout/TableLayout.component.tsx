import { Table } from '@repo/ui/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
} from '@repo/ui/components/Table/contexts';
import { TableSuspenseBoundary } from '@repo/ui/components/Table/TableSuspenseBoundary';
import * as stylex from '@stylexjs/stylex';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  actions,
  columnsState,
  crud,
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
                actions={actions}
                crud={crud}
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
