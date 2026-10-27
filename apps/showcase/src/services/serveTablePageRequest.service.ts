import type { ColumnSort } from '@lcabrera/server/sort/sort.types';

import { parseTablePageParams } from '@lcabrera/server/table-page/parse-table-page-params.util';
import { toRefusedTablePage } from '@lcabrera/server/table-page/to-refused-table-page.util';
import {
  ACTIONS_COLUMN_KEY,
  INITIAL_PAGE_SIZE,
} from '@lcabrera/ui/components/Table/Table.constants';

export type ServeTablePageRequestArgs = {
  readonly fallbackSort: readonly ColumnSort[];
  readonly maxLimit: number;
  readonly request: Request;
  readonly selectPage: (window: TablePageWindow) => Promise<unknown>;
};

export type TablePageWindow = {
  readonly limit: number;
  readonly offset: number;
  readonly sorting: readonly ColumnSort[];
};

export const serveTablePageRequest = async ({
  fallbackSort,
  maxLimit,
  request,
  selectPage,
}: ServeTablePageRequestArgs) => {
  const parsed = parseTablePageParams({
    defaultLimit: INITIAL_PAGE_SIZE,
    fallbackSort,
    ignoredSortColumns: [ACTIONS_COLUMN_KEY],
    params: new URL(request.url).searchParams,
  });

  if (parsed.kind === 'refused') {
    return Response.json(toRefusedTablePage(parsed.message));
  }

  const { limit, skip, sort } = parsed.params;
  const page = await selectPage({
    limit: Math.min(maxLimit, Math.max(1, limit)),
    offset: skip,
    sorting: sort.map(({ column, direction }) => ({
      columnKey: column,
      direction,
    })),
  });

  return Response.json(page);
};
