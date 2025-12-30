import { Suspense, use } from 'react';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

import { Table } from '../Table.component';

/**
 * Inner component that uses React 19's `use()` hook to unwrap the promise
 */
const TableDataResolver = <TData extends Record<string, unknown>>({
  children,
  dataPromise,
}: {
  children: (data: TData[]) => React.ReactNode;
  dataPromise: Promise<TData[]>;
}) => {
  const data = use(dataPromise);
  return <>{children(data)}</>;
};

/**
 * Table skeleton fallback for Suspense boundary
 */
const TableSkeletonFallback = <TData extends Record<string, unknown>>({
  columns,
  skeletonRowCount,
}: Pick<
  TableSuspenseBoundaryProps<TData>,
  'columns' | 'skeletonRowCount'
>) => (
  <Table<TData>
    columns={columns}
    data={[]}
    isLoading
    skeletonRowCount={skeletonRowCount}
  />
);

/**
 * Suspense boundary wrapper for Table with data promise
 *
 * Uses React 19's `use()` hook to unwrap the data promise.
 * Shows skeleton loading state while promise is pending.
 *
 * @example
 * ```tsx
 * // In your route component
 * const dataPromise = fetchTableData();
 *
 * <TableSuspenseBoundary
 *   dataPromise={dataPromise}
 *   columns={columns}
 * >
 *   {(data) => <Table columns={columns} data={data} />}
 * </TableSuspenseBoundary>
 * ```
 */
export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
>({
  children,
  columns,
  dataPromise,
  skeletonRowCount,
}: TableSuspenseBoundaryProps<TData>) => (
  <Suspense
    fallback={
      <TableSkeletonFallback<TData>
        columns={columns}
        skeletonRowCount={skeletonRowCount}
      />
    }
  >
    <TableDataResolver dataPromise={dataPromise}>{children}</TableDataResolver>
  </Suspense>
);
