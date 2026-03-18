import type { ReactNode } from 'react';

import type { DataKey } from '@/components/Table/Table.types';

export type InfiniteScroll<TData, TResponse> = {
  dataSelector?: (response: TResponse) => TData[];
  dataTotalSelector?: (response: TResponse) => number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: (params: Pagination) => Promise<TResponse>;
};

export type LayoutProps = {
  children: ReactNode;
};

export type Pagination = {
  limit: number;
  skip: number;
};

export type PinConflictState = {
  isOpen: boolean;
  side: 'left' | 'right';
};

export type PinSide = 'closest-edge' | 'left' | 'right';

export type SortDirection = 'asc' | 'desc' | undefined;

export type Sorting<TData = Record<string, unknown>> = {
  /** Column key being sorted */
  columnKey: DataKey<TData>;
  /** Sort direction */
  direction?: SortDirection;
};
