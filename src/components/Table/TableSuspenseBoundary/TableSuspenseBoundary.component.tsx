import { Suspense } from 'react';

import { Table } from '@/components/Table';
import { TableDataResolver } from '@/components/Table/TableDataResolver';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

/**
 * Suspense boundary wrapper for Table with data promise
 *
 * Uses React 19's `use()` hook to unwrap the data promise.
 * Shows skeleton loading state while promise is pending.
 *
 * @example
 * ```tsx
 * // When API returns data array directly
 * <TableSuspenseBoundary
 *   dataPromise={dataPromise}
 *   columns={columns}
 * >
 *   {(data) => <Table columns={columns} data={data} />}
 * </TableSuspenseBoundary>
 *
 * // When API returns a response object with data property
 * <TableSuspenseBoundary
 *   dataPromise={responsePromise}
 *   dataSelector={(response) => response.data}
 *   columns={columns}
 * >
 *   {(data) => <Table columns={columns} data={data} />}
 * </TableSuspenseBoundary>
 * ```
 */
export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
  TResponse = TData[],
>({
  children,
  columns,
  columnSizing,
  dataPromise,
  dataSelector,
  persistenceKey,
  title,
}: TableSuspenseBoundaryProps<TData, TResponse>) => (
  <Suspense
    fallback={
      <Table<TData>
        columns={columns}
        columnSizing={columnSizing}
        data={[]}
        isLoading
        persistenceKey={persistenceKey}
        title={title}
      />
    }
  >
    <TableDataResolver<TData, TResponse>
      dataPromise={dataPromise}
      dataSelector={dataSelector}
    >
      {children}
    </TableDataResolver>
  </Suspense>
);
