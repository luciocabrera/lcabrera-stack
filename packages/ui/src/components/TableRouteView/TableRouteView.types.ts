import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import type { TableGroupDrillRequest } from '#ui/components/Table';
import type { TableLayoutProps } from '#ui/components/Table/TableLayout/TableLayout.types';
import type { TablePageResponse } from '#ui/types/ui.types';

export type TableRouteViewProps<
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
> = Pick<
  TableLayoutProps<TData, TResponse>,
  'actions' | 'dataErrorSelector' | 'dataSelector' | 'dataTotalSelector'
> & {
  /**
   * The route's drilled read (ADR-079). Omit it and the table offers no drill,
   * whatever the loader's `isGroupDrillEnabled` says — the flag declares the
   * endpoint exists, this is the call that reaches it.
   */
  readonly fetchDrill?: (
    query: PaginatedQuery & TableGroupDrillRequest,
  ) => Promise<TResponse>;
  /** The route's paginated read — typically a `createPaginatedFetcher` result. */
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
};
