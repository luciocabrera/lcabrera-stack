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
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  defaultColumnPinning,
  density = 'comfortable',
  enablePrefetch,
  filters,
  isBordered = true,
  isStriped = true,
  loadMorePageSize,
  onLoadMore,
  persistenceKey,
  sorting,
  suspenseKey,
  title,
}: TableLayoutProps<TData, TResponse>) => {
  const columnsState = {
    columnFilters: filters,
    columnOrder,
    columnPinning: columnPinning ?? defaultColumnPinning,
    columns,
    columnSizing,
    columnVisibility,
    sorting,
  };

  const metaState = {
    density,
    enablePrefetch,
    isBordered,
    isStriped,
    loadMorePageSize,
    persistenceKey,
    title,
  };

  return (
    <div {...stylex.props(styles.container)}>
      <TableConfigProvider<TData>
        columnsState={columnsState}
        metaState={metaState}
      >
        <FiltersDataProvider<TData> columns={columns}>
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
        </FiltersDataProvider>
      </TableConfigProvider>
    </div>
  );
};
