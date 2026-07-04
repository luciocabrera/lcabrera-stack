import type { ReactNode } from 'react';

import type { DataKey } from '@repo/ui/components/Table/Table.types';

export type InfiniteScroll<TData, TResponse> = {
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly hasMore?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onLoadMore?: (params: Pagination) => Promise<TResponse>;
};

export type LayoutProps = {
  readonly children: ReactNode;
};

export type Pagination = {
  readonly limit: number;
  readonly skip: number;
};

export type PinConflictResolution =
  | 'move-column'
  | 'pin-all-between'
  | 'pin-only';

export type PinConflictState = {
  readonly isOpen: boolean;
  readonly side: 'left' | 'right';
};

export type PinSide = 'closest-edge' | 'left' | 'right';

export type PrefetchCache<TResponse> = {
  readonly data?: TResponse;
  readonly promise?: Promise<TResponse>;
  readonly skip: number;
};

export type SortDirection = 'asc' | 'desc' | undefined;

export type Sorting<TData = Record<string, unknown>> = {
  /** Column key being sorted */
  readonly columnKey: DataKey<TData>;
  /** Sort direction */
  readonly direction?: SortDirection;
};
