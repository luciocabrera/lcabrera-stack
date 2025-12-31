import type { ReactNode } from 'react';

export type TableDataResolverProps<
  TData extends Record<string, unknown>,
  TResponse = TData[],
> = {
  children: (data: TData[]) => ReactNode;
  dataPromise: Promise<TResponse>;
  /** Function to extract data array from the response. Defaults to identity (response is the data array). */
  dataSelector?: (response: TResponse) => TData[];
};
