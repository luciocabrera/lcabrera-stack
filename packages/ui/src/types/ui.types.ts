import type { ReactNode } from 'react';

import type {
  DataKey,
  TableResponseError,
} from '#ui/components/Table/Table.types';

export type InfiniteScroll<TData, TResponse> = {
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly hasMore?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onLoadMore?: (params: Pagination<TData>) => Promise<TResponse>;
};

export type LayoutProps = {
  readonly children: ReactNode;
};

export type Pagination<TData = unknown> = {
  readonly lastRow?: TData;
  readonly limit: number;
  readonly skip: number;
};

export type PinConflictResolution =
  | 'move-column'
  | 'pin-all-between'
  | 'pin-only';

export type PinSide = 'closest-edge' | 'left' | 'right';

export type PrefetchCache<TResponse> = {
  readonly data?: TResponse;
  readonly promise?: Promise<TResponse>;
  readonly skip: number;
};

export type SortDirection = 'asc' | 'desc' | undefined;

export type Sorting<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly direction?: SortDirection;
};

export type TablePageResponse<TData> = {
  readonly data: readonly TData[];
  readonly error?: TableResponseError;
  readonly hasMore?: boolean;
  readonly total?: number;
};
