import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import type { TablePageResponse } from '#ui/types/ui.types';

export type TableGroupDetailsViewProps<
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
> = {
  /** Where closing the dialog returns, keeping the view's own search params. */
  readonly closePath: string;
  /** The title when the loader states no locked filters. */
  readonly fallbackTitle?: string;
  readonly fetchPage: (query: TableGroupPageQuery) => Promise<TResponse>;
};

export type TableGroupPageQuery = PaginatedQuery & {
  /** The drill-down group token the page was opened with. */
  readonly group: string;
};
