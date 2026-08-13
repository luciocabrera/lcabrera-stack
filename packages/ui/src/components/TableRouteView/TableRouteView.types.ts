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
  /** The route's paginated read — typically a `createPaginatedFetcher` result. */
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
};
