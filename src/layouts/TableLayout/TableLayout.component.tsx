import * as stylex from '@stylexjs/stylex';

import { Table } from '@/components/Table';
import { TableProvider } from '@/components/Table/TableContext';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <TData extends Record<string, unknown>>({
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  dataPromise,
  dataSelector,
  density = 'comfortable',
  filters,
  infiniteScrollConfig,
  isBordered = true,
  isStriped = true,
  persistenceKey,
  sorting,
  title,
}: TableLayoutProps<TData>) => {
  const sortKey = JSON.stringify(sorting);
  const filterKey = JSON.stringify(filters);
  const tableKey = `${sortKey}-${filterKey}`;

  return (
    <div {...stylex.props(styles.container)}>
      <TableProvider<TData>
        initialColumnFilters={filters}
        initialColumnOrder={columnOrder}
        initialColumns={columns}
        initialColumnSizing={columnSizing}
        initialColumnVisibility={columnVisibility}
        initialSorting={sorting}
        persistenceKey={persistenceKey}
      >
        <TableSuspenseBoundary<TData, unknown>
          dataPromise={dataPromise}
          dataSelector={dataSelector}
          persistenceKey={persistenceKey}
          title={title}
        >
          {(data) => (
            <Table<TData>
              data={data}
              density={density}
              infiniteScrollConfig={infiniteScrollConfig}
              isBordered={isBordered}
              isStriped={isStriped}
              key={tableKey}
              persistenceKey={persistenceKey}
              title={title}
            />
          )}
        </TableSuspenseBoundary>
      </TableProvider>
    </div>
  );
};
