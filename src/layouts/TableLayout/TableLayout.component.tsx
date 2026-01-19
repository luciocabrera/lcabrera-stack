import * as stylex from '@stylexjs/stylex';

import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';
import { TableLayoutInner } from './TableLayoutInner';

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
  // Provide safe defaults for optional props with proper type guards
  const normalizedColumnOrder: string[] =
    (columnOrder as string[] | undefined) ?? [];
  const normalizedColumnVisibility: Set<string> =
    (columnVisibility as Set<string> | undefined) ?? new Set<string>();
  const normalizedDensity: 'comfortable' | 'compact' = density as
    | 'comfortable'
    | 'compact';

  return (
    <div {...stylex.props(styles.container)}>
      <TableSuspenseBoundary<TData, unknown>
        columns={columns}
        columnSizing={columnSizing}
        dataPromise={dataPromise}
        dataSelector={dataSelector}
        initialColumnOrder={normalizedColumnOrder}
        initialColumnVisibility={normalizedColumnVisibility}
        title={title}
      >
        {(data) => (
          <TableLayoutInner<TData>
            columnOrder={normalizedColumnOrder}
            columns={columns}
            columnSizing={columnSizing}
            columnVisibility={normalizedColumnVisibility}
            density={normalizedDensity}
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
