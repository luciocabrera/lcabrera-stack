import { use } from 'react';

import type { TableDataResolverProps } from './TableDataResolver.types';
function isPromise<T = any>(value: any): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  );
}

export const TableDataResolver = <TResponse,>({
  children,
  dataPromise,
}: TableDataResolverProps<TResponse>) => {
  const response = isPromise(dataPromise) ? use(dataPromise) : dataPromise;

  return <>{children(response)}</>;
};
