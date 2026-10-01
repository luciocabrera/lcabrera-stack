import type { OlapGroupRead } from '../db/olap/olap.types.ts';
import type { ColumnFilter } from '../filters/filters.types.ts';
import type { TablePageReader } from './create-table-page-reader.util.ts';
import type { TablePageSortRule } from './table-page.types.ts';

import { toQueryFilters } from '../filters/to-query-filters.util.ts';
import { toQuerySortRules } from './to-query-sort-rules.util.ts';
import { toRefusedTablePage } from './to-refused-table-page.util.ts';

export type CreateGroupDetailReadsArgs<TPage> = {
  /** Labels the locked-filter statement; a column with no label shows its key. */
  readonly columns: Parameters<
    TablePageReader['resolveGroupRestriction']
  >[0]['columns'];
  /** Size of the first page of the group's rows. */
  readonly limit: number;
  readonly reader: Pick<
    TablePageReader,
    'resolveGroupRead' | 'resolveGroupRestriction'
  > & {
    readonly selectPage: (read: OlapGroupRead) => Promise<TPage>;
  };
};

export type GroupDetailPageArgs = {
  readonly effectiveSorting: readonly TablePageSortRule[];
  readonly filters: Readonly<Record<string, ColumnFilter>>;
  readonly request: Request;
};

export type GroupDetailRequestArgs = {
  readonly request: Request;
};

export const createGroupDetailReads = <TPage>({
  columns,
  limit,
  reader,
}: CreateGroupDetailReadsArgs<TPage>) => ({
  fetchPage: async ({
    effectiveSorting,
    filters,
    request,
  }: GroupDetailPageArgs) => {
    const resolved = await reader.resolveGroupRead({
      filters: toQueryFilters({ filters }),
      isGroupRequired: true,
      limit,
      params: new URL(request.url).searchParams,
      skip: 0,
      sort: toQuerySortRules({ sorting: effectiveSorting }).map(
        ({ columnKey, direction }) => ({ column: columnKey, direction }),
      ),
    });

    return resolved.kind === 'refused'
      ? toRefusedTablePage(resolved.message)
      : reader.selectPage(resolved.read);
  },
  resolveLockedFilters: async ({ request }: GroupDetailRequestArgs) =>
    reader.resolveGroupRestriction({
      columns,
      isGroupRequired: true,
      params: new URL(request.url).searchParams,
    }),
});
