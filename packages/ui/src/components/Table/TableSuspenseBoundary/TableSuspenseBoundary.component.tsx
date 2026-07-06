import { TableDataResolver } from '@repo/ui/components/Table/TableDataResolver';
import { Suspense } from 'react';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

import { TableSkeleton } from '../TableSkeleton';

export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  actions,
  children,
  crud,
  dataPromise,
}: TableSuspenseBoundaryProps<TData, TResponse>) => {
  return (
    <Suspense fallback={<TableSkeleton<TData> actions={actions} crud={crud} />}>
      <TableDataResolver<TResponse> dataPromise={dataPromise}>
        {children}
      </TableDataResolver>
    </Suspense>
  );
};
