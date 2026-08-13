import type { ReactNode } from 'react';

import type {
  DataKey,
  TableResponseError,
} from '#ui/components/Table/Table.types';

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

/**
 * The response shape a paginated table endpoint returns. `TableRouteView`
 * constrains its response to this so `dataSelector` / `dataTotalSelector` have
 * working defaults; a response that names its fields differently uses
 * `TableLayout` with explicit selectors instead.
 *
 * `total` is optional because a server need only count once per scroll session
 * (see `dataTotalSelector`), and `hasMore` because an endpoint can also signal
 * exhaustion by returning fewer rows than `limit`.
 */
export type TablePageResponse<TData> = {
  readonly data: readonly TData[];
  /**
   * Why the read returned no rows, when the endpoint refused it rather than
   * failing. A refusal is an expected outcome — a grouping the database will
   * not run, a statement that timed out — so it arrives as a **successful**
   * response carrying data, not as a rejected promise, and the route's error
   * boundary never sees it. `dataErrorSelector` defaults to reading it (#642).
   */
  readonly error?: TableResponseError;
  readonly hasMore?: boolean;
  readonly total?: number;
};
