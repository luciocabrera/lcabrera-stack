import * as stylex from '@stylexjs/stylex';

import { Table } from '@/components/Table';
import { TableConfigProvider } from '@/components/Table/contexts';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  density = 'comfortable',
  filters,
  isBordered = true,
  isStriped = true,
  onLoadMore,
  persistenceKey,
  sorting,
  suspenseKey,
  title,
}: TableLayoutProps<TData, TResponse>) => {
  const columnsState = {
    columnFilters: filters,
    columnOrder,
    columns,
    columnSizing,
    columnVisibility,
    sorting,
  };

  const metaState = {
    density,
    isBordered,
    isStriped,
    persistenceKey,
    title,
  };

  return (
    <div {...stylex.props(styles.container)}>
      <TableConfigProvider<TData>
        columnsState={columnsState}
        metaState={metaState}
      >
        <TableSuspenseBoundary<TData, TResponse>
          dataPromise={dataPromise}
          key={suspenseKey}
        >
          {(response) => (
            <Table<TData, TResponse>
              dataSelector={dataSelector}
              dataTotalSelector={dataTotalSelector}
              onLoadMore={onLoadMore}
              response={response}
            />
          )}
        </TableSuspenseBoundary>
      </TableConfigProvider>
    </div>
  );
};
