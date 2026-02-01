import { use } from 'react';

import type { TableDataResolverProps } from './TableDataResolver.types';

export const TableDataResolver = <TResponse,>({
  children,
  dataPromise,
}: TableDataResolverProps<TResponse>) => {
  const response = use(dataPromise);

  return <>{children(response)}</>;
};
