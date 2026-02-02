import type { ReactNode } from 'react';

export type InfiniteScroll<
  TData,
  TResponse,
> = {
  dataSelector?: (response: TResponse) => TData[];
  dataTotalSelector?: (response: TResponse) => number;
  onLoadMore?: (params: PaginationState) => Promise<TResponse>;
};

export type LayoutProps = {
  children: ReactNode;
};

export type PaginationState = {
  limit: number;
  skip: number;
};
