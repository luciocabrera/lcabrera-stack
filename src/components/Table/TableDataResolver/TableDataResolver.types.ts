import type { ReactNode } from 'react';

export type TableDataResolverProps<TResponse> = {
  children: (response: TResponse) => ReactNode;
  dataPromise: Promise<TResponse>;
};
