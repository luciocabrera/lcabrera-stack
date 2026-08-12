import { Suspense } from 'react';

import { TableDataResolver } from '#ui/components/Table/TableDataResolver';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

import { TableSkeleton } from '../TableSkeleton';

export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  actions,
  children,
  dataPromise,
}: TableSuspenseBoundaryProps<TData, TResponse>) => {
  return (
    <Suspense fallback={<TableSkeleton<TData> actions={actions} />}>
      <TableDataResolver<TResponse> dataPromise={dataPromise}>
        {children}
      </TableDataResolver>
    </Suspense>
  );
};
