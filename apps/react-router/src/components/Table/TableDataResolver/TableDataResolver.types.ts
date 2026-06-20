import type { ReactNode } from 'react';

export type TableDataResolverProps<TResponse> = {
  readonly children: (response: TResponse) => ReactNode;
  readonly dataPromise: Promise<TResponse>;
};
