import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'react-router';

import type {
  InfiniteScrollConfig,
  OffsetLimitParams,
  OnFilterChangeArgs,
  OnSortChangeArgs,
} from '@/components/Table';

import { Table } from '@/components/Table';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutInnerProps, TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

/**
 * Reusable layout component for pages that display tables with infinite scroll
 * 
 * Handles common patterns like:
 * - Suspense boundary for initial data loading
 * - URL state synchronization (sorting, filters)
 * - Infinite scroll configuration
 * - Table remounting on state changes
 * 
 * @example
 * ```tsx
 * export const MyDataRoute = () => {
 *   const loaderData = useLoaderData<typeof loader>();
 *   
 *   return (
 *     <TableLayout
 *       columns={columns}
 *       dataPromise={loaderData.dataPromise}
 *       dataSelector={(response) => response.data}
 *       filters={loaderData.filters}
 *       infiniteScrollConfig={{
 *         onLoadMore: async ({ limit, skip }) => {
 *           const response = await api.fetchData({ limit, skip });
 *           return { data: response.data, hasMore: response.hasMore };
 *         }
 *       }}
 *       persistenceKey="my-data-table"
 *       sorting={loaderData.sorting}
 *       title="My Data Table"
 *     />
 *   );
 * };
 * ```
 */
export const TableLayout = <TData extends Record<string, unknown>>({
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  dataPromise,
  dataSelector,
  density = 'comfortable',
  filters,
  infiniteScrollConfig: infiniteConfigProp,
  isBordered = true,
  isStriped = true,
  persistenceKey,
  sorting,
  title,
}: TableLayoutProps<TData>) => {
  return (
    <div {...stylex.props(styles.container)}>
      <TableSuspenseBoundary<TData, unknown>
        columns={columns}
        columnSizing={columnSizing}
        dataPromise={dataPromise}
        dataSelector={dataSelector}
        initialColumnOrder={columnOrder}
        initialColumnVisibility={columnVisibility}
        title={title}
      >
        {(data) => (
          <TableLayoutInner
            columnOrder={columnOrder}
            columns={columns}
            columnSizing={columnSizing}
            columnVisibility={columnVisibility}
            density={density}
            filters={filters}
            infiniteScrollConfig={infiniteConfigProp}
            initialData={data}
            isBordered={isBordered}
            isStriped={isStriped}
            persistenceKey={persistenceKey}
            sorting={sorting}
            title={title}
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};

const TableLayoutInner = <TData extends Record<string, unknown>>({
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  density,
  filters: currentFilters,
  infiniteScrollConfig: infiniteConfigProp,
  initialData,
  isBordered,
  isStriped,
  persistenceKey,
  sorting: currentSorting,
  title,
}: TableLayoutInnerProps<TData>) => {
  const [, setSearchParams] = useSearchParams();

  const handleSortChange = ({ sorting }: OnSortChangeArgs) => {
    if (!Array.isArray(sorting)) return Promise.resolve();

    setSearchParams((params) => {
      if (sorting.length > 0) {
        params.set('sort', JSON.stringify(sorting));
      } else {
        params.delete('sort');
      }
      return params;
    });

    return Promise.resolve();
  };

  const handleFilterChange = ({ filters }: OnFilterChangeArgs) => {
    setSearchParams((params) => {
      if (Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));
      } else {
        params.delete('filters');
      }
      return params;
    });

    return Promise.resolve();
  };

  const infiniteScrollConfig: InfiniteScrollConfig<TData> = {
    initialPageSize: 50,
    isEnabled: true,
    loadMorePageSize: 50,
    onLoadMore: async (params) => {
      const { limit, skip } = params as OffsetLimitParams;
      
      // Call the provided onLoadMore with current state
      const result = await infiniteConfigProp.onLoadMore({
        filters: currentFilters,
        limit,
        skip,
        sorting: currentSorting,
      });

      return {
        data: result.data,
        hasMore: result.hasMore,
        totalRows: result.total ?? result.data.length,
      };
    },
    strategy: 'offset-limit',
    threshold: 200,
  };

  // Generate key to force Table remount when state changes
  const sortKey = currentSorting ? JSON.stringify(currentSorting) : 'default';
  const filterKey = currentFilters ? JSON.stringify(currentFilters) : 'default';
  const tableKey = `${sortKey}-${filterKey}`;

  return (
    <Table
      columns={columns}
      columnSizing={columnSizing}
      data={initialData}
      density={density}
      infiniteScrollConfig={infiniteScrollConfig}
      initialColumnFilters={currentFilters ?? {}}
      initialColumnOrder={columnOrder}
      initialColumnVisibility={columnVisibility}
      initialMeta={{
        hasMore: true,
        paginationMeta: {
          offset: initialData.length,
        },
      }}
      initialSorting={currentSorting ?? []}
      isBordered={isBordered}
      isStriped={isStriped}
      key={tableKey}
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      persistenceKey={persistenceKey}
      title={title}
    />
  );
};
