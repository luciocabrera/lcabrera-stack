import type { ColumnFilter } from '../filters/filters.types.ts';
import type { TablePageReader } from './create-table-page-reader.util.ts';
import type {
  TablePageGrouping,
  TablePageRead,
  TablePageSortRule,
} from './table-page.types.ts';

import { toQueryFilters } from '../filters/to-query-filters.util.ts';
import { toQuerySortRules } from './to-query-sort-rules.util.ts';

export type CreateTableLoaderReadsArgs<
  TPage,
  TGrouping extends TablePageGrouping,
> = {
  /** Size of the first page the table opens on. */
  readonly limit: number;
  readonly reader: Pick<TablePageReader, 'selectGroupingCapabilities'> & {
    readonly selectPage: (read: TableLoaderRead<TGrouping>) => Promise<TPage>;
  };
};

export type TableLoaderPageArgs<
  TGrouping extends TablePageGrouping = TablePageGrouping,
> = {
  readonly effectiveSorting: readonly TablePageSortRule[];
  readonly filters: Readonly<Record<string, ColumnFilter>>;
  /** A grouping with no keys reads rows. */
  readonly grouping?: TGrouping;
  readonly totalsPlacement?: TablePageRead['totalsPlacement'];
};

export type TableLoaderRead<
  TGrouping extends TablePageGrouping = TablePageGrouping,
> = Omit<TablePageRead, 'grouping'> & {
  readonly grouping?: TGrouping;
};

export const createTableLoaderReads = <
  TPage,
  TGrouping extends TablePageGrouping = TablePageGrouping,
>({
  limit,
  reader,
}: CreateTableLoaderReadsArgs<TPage, TGrouping>) => ({
  fetchPage: async ({
    effectiveSorting,
    filters,
    grouping,
    totalsPlacement,
  }: TableLoaderPageArgs<TGrouping>) =>
    reader.selectPage({
      filters: toQueryFilters({ filters }),
      ...(grouping !== undefined && { grouping }),
      includeTotal: true,
      limit,
      offset: 0,
      sort: toQuerySortRules({ sorting: effectiveSorting }).map(
        ({ columnKey, direction }) => ({ column: columnKey, direction }),
      ),
      ...(totalsPlacement !== undefined && { totalsPlacement }),
    }),
  resolveGroupingCapabilities: async () => reader.selectGroupingCapabilities(),
});
