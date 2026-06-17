import { Suspense } from 'react';

import { TableDataResolver } from '@/components/Table/TableDataResolver';

import type { TableSuspenseBoundaryProps } from './TableSuspenseBoundary.types';

import { TableSkeleton } from '../TableSkeleton';

export const TableSuspenseBoundary = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  children,
  dataPromise,
  onRetry,
}: TableSuspenseBoundaryProps<TData, TResponse>) => {
  const safeDataPromise = dataPromise
    .then((data) => ({ data, ok: true as const }))
    .catch((error: unknown) => ({ error, ok: false as const }));

  return (
    <Suspense fallback={<TableSkeleton />}>
      <TableDataResolver<TResponse>
        onRetry={onRetry}
        safeDataPromise={safeDataPromise}
      >
        {children}
      </TableDataResolver>
    </Suspense>
  );
};
