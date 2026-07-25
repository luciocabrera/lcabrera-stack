import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

export type InfiniteScroll<TData, TResponse> = {
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  /**
   * Total rows matching the current filters. May return `undefined` for a
   * load-more page, which keeps the total already in the store — the total
   * cannot change within a scroll session, so a server need only count once.
   */
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly hasMore?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onLoadMore?: (params: Pagination<TData>) => Promise<TResponse>;
};

export type LayoutProps = {
  readonly children: ReactNode;
};

export type Pagination<TData = unknown> = {
  /**
   * The last row loaded so far, when there is one — the anchor a keyset
   * ("seek") data source resumes from. `skip` cannot express "resume after this
   * row", and only the consumer knows which of the row's fields make up its
   * sort key, so the Table hands the row over and stays out of it. Offset-based
   * sources ignore it.
   */
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
  /** Column key being sorted */
  readonly columnKey: DataKey<TData>;
  /** Sort direction */
  readonly direction?: SortDirection;
};
