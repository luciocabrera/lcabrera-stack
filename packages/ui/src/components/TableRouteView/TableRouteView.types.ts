import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import type { TableLayoutProps } from '#ui/components/Table/TableLayout/TableLayout.types';
import type { TablePageResponse } from '#ui/types/ui.types';

export type TableRouteViewProps<
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
> = Pick<
  TableLayoutProps<TData, TResponse>,
  'actions' | 'dataSelector' | 'dataTotalSelector'
> & {
  /** The route's paginated read — typically a `createPaginatedFetcher` result. */
  readonly fetchPage: (query: PaginatedQuery) => Promise<TResponse>;
  /** Send the last loaded row as a keyset cursor (ADR-052). Off by default. */
  readonly isKeysetEnabled?: boolean;
  /** Send the table's column filters with each page. Off by default. */
  readonly isServerFilterEnabled?: boolean;
};
