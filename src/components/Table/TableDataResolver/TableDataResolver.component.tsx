import { use } from 'react';

import type { TableDataResolverProps } from './TableDataResolver.types';

/**
 * Inner component that uses React 19's `use()` hook to unwrap the promise
 */
export const TableDataResolver = <
  TData extends Record<string, unknown>,
  TResponse = TData[],
>({
  children,
  dataPromise,
  dataSelector = (response) => response as unknown as TData[],
}: TableDataResolverProps<TData, TResponse>) => {
  const response = use(dataPromise);
  const data = dataSelector(response);
  return <>{children(data)}</>;
};
