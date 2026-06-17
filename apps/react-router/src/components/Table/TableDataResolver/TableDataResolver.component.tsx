import { use } from 'react';

import { TableDataErrorFallback } from '@/components/Table/TableDataErrorFallback';

import type { TableDataResolverProps } from './TableDataResolver.types';

export const TableDataResolver = <TResponse,>({
  children,
  onRetry,
  safeDataPromise,
}: TableDataResolverProps<TResponse>) => {
  const result = use(safeDataPromise);

  if (!result.ok) {
    return <TableDataErrorFallback error={result.error} onRetry={onRetry} />;
  }

  return <>{children(result.data)}</>;
};
