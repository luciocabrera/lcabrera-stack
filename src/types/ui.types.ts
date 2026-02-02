import type { ReactNode } from 'react';

export type InfiniteScroll<
  TData,
  TResponse,
> = {
  dataSelector?: (response: TResponse) => TData[];
  dataTotalSelector?: (response: TResponse) => number;
  onLoadMore?: (params: Pagination) => Promise<TResponse>;
};

export type LayoutProps = {
  children: ReactNode;
};

export type Pagination = {
  limit: number;
  skip: number;
};

export type SortDirection = 'asc' | 'desc' | undefined;


export type Sorting = {
  /** Column key being sorted */
  columnKey: string;
  /** Sort direction */
  direction?: SortDirection;
};
