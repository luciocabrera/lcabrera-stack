import { Suspense } from 'react';

import { TableDataResolver } from '@/components/Table/TableDataResolver';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

import { Table } from '../Table.component';

export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
  TResponse = TData[],
>({
  children,
  dataPromise,
  dataSelector,
  persistenceKey,
  title,
}: TableSuspenseBoundaryProps<TData, TResponse>) => (
  <Suspense
    fallback={
      <Table<TData>
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
