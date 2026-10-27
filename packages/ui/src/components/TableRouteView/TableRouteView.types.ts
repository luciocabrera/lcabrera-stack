import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import type { TableLayoutProps } from '#ui/components/Table/TableLayout/TableLayout.types';
import type { TablePageResponse } from '#ui/types/ui.types';

export type TableRouteViewProps<
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
> = Pick<
  TableLayoutProps<TData, TResponse>,
  'actions' | 'dataErrorSelector' | 'dataSelector' | 'dataTotalSelector'
> & {
  /** Defaults to a fetcher for the `pagePath` the route loader declares. */
  readonly fetchPage?: (query: PaginatedQuery) => Promise<TResponse>;
};
