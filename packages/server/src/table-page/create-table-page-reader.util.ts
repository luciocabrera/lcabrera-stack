import type { QueryResultRow } from 'pg';

import type { GroupKeyPeriod } from '../db/group-query-builder/group-query-builder.types.ts';
import type { ColumnSort } from '../sort/sort.types.ts';
import type {
  TablePage,
  TablePageRead,
  TablePageTarget,
} from './table-page.types.ts';

import { deleteRows } from '../db/delete-rows.util.ts';
import { getColumnGroupingCapabilities } from '../db/get-column-grouping-capabilities.util.ts';
import { getRowsCount } from '../db/get-rows-count.util.ts';
import { resolveGroupRead } from '../db/olap/resolve-group-read.util.ts';
import { resolveGroupRestriction } from '../db/olap/resolve-group-restriction.util.ts';
import { toGroupKeyTruncations } from '../db/olap/to-group-key-truncations.util.ts';
import { selectRows } from '../db/select-rows.util.ts';
import { createTableLoaderReads } from './create-table-loader-reads.util.ts';
import { createTablePageLoader } from './create-table-page-loader.util.ts';
import { parseTablePageParams } from './parse-table-page-params.util.ts';
import { selectGroupedTablePage } from './select-grouped-table-page.util.ts';
import {
  TABLE_PAGE_DEFAULT_GROUP_MAX_ROWS,
  TABLE_PAGE_DEFAULT_LIMIT,
  TABLE_PAGE_DEFAULT_MAX_LIMIT,
  TABLE_SOURCE_CAPABILITIES,
} from './table-page.constants.ts';
import { toKeysetCursor } from './to-keyset-cursor.util.ts';

export type CreateTablePageReaderArgs<TKey extends string = string> = {
  /** Page size of the first page and of a request that names no `limit`. Defaults to 50. */
  readonly defaultLimit?: number;
  /** Order a request that sends no usable sort gets. Defaults to `primaryKey` ascending. */
  readonly fallbackSort?: readonly ColumnSort[];
  /** Columns a row read projects. Defaults to `target.allowedColumns`. */
  readonly fields?: readonly string[];
  /** Row ceiling of a grouped read, which is never paginated. Defaults to 5000. */
  readonly groupMaxRows?: number;
  /** Sort keys that name no data column; dropped from every read this reader resolves. */
  readonly ignoredSortColumns?: readonly string[];
  /** Largest page a request can ask for; smaller pages pass through. Defaults to 1000. */
  readonly maxLimit?: number;
  /** Longest ORDER BY a request can ask for. Defaults to the allowed column count. */
  readonly maxSortRules?: number;
  /** Path the route answering with `pageLoader` is mounted at; `source` carries it to the grid. */
  readonly pagePath?: string;
  /** Unique, non-null column that breaks sort ties and anchors keyset pages. */
  readonly primaryKey: TKey;
  readonly target: TablePageTarget;
};

export type TablePageGroupReadArgs = Omit<
  Parameters<typeof resolveGroupRead>[0],
  'maxLimit' | 'primaryKey' | 'selectTruncations'
>;

export type TablePageGroupRestrictionArgs = Omit<
  Parameters<typeof resolveGroupRestriction>[0],
  'selectTruncations'
>;

export const createTablePageReader = <
  TRow extends QueryResultRow,
  TKey extends keyof TRow & string,
>({
  defaultLimit = TABLE_PAGE_DEFAULT_LIMIT,
  fallbackSort,
  fields,
  groupMaxRows = TABLE_PAGE_DEFAULT_GROUP_MAX_ROWS,
  ignoredSortColumns,
  maxLimit = TABLE_PAGE_DEFAULT_MAX_LIMIT,
  maxSortRules,
  pagePath,
  primaryKey,
  target,
}: CreateTablePageReaderArgs<TKey>) => {
  const sortRuleCeiling = maxSortRules ?? target.allowedColumns.length;
  const projection = fields ?? target.allowedColumns;

  const selectGroupingCapabilities = async () =>
    getColumnGroupingCapabilities({
      columns: target.allowedColumns,
      schema: target.schema,
      table: target.table,
    });

  const selectGroupKeyTruncations = async (
    periods: Readonly<Record<string, GroupKeyPeriod>> | undefined,
  ) => {
    const columns = Object.keys(periods ?? {});

    if (columns.length === 0) return {};

    return toGroupKeyTruncations({
      capabilities: await getColumnGroupingCapabilities({
        columns,
        schema: target.schema,
        table: target.table,
      }),
      periods,
    });
  };

  const selectPage = async ({
    cursor,
    filters,
    grouping,
    includeTotal,
    limit,
    offset,
    sort,
    totalsPlacement = 'last',
  }: TablePageRead): Promise<TablePage<TRow>> => {
    const boundedSort = sort.slice(0, sortRuleCeiling);

    if (grouping !== undefined && grouping.keys.length > 0) {
      return selectGroupedTablePage({
        filters,
        grouping,
        maxRows: groupMaxRows,
        sort: boundedSort,
        subtotalPlacement: totalsPlacement,
        target,
      });
    }

    const boundedLimit = Math.min(maxLimit, Math.max(1, limit));
    const keysetCursor = toKeysetCursor({
      cursor,
      sort: boundedSort,
      uniqueColumn: primaryKey,
    });

    const [data, total] = await Promise.all([
      selectRows<TRow>({
        ...target,
        fields: projection,
        filters,
        limit: boundedLimit,
        sort: boundedSort,
        ...(keysetCursor === undefined ? { offset } : { cursor: keysetCursor }),
      }),
      includeTotal
        ? getRowsCount({ ...target, column: primaryKey, filters })
        : undefined,
    ]);

    return {
      data,
      hasMore:
        total === undefined
          ? data.length === boundedLimit
          : offset + data.length < total,
      ...(total !== undefined && { total }),
    };
  };

  const resolveTableGroupRead = async (args: TablePageGroupReadArgs) =>
    resolveGroupRead({
      ...args,
      maxLimit,
      primaryKey,
      selectTruncations: selectGroupKeyTruncations,
      sort: args.sort.filter(
        ({ column }) => !(ignoredSortColumns ?? []).includes(column),
      ),
    });

  const resolveTableGroupRestriction = async (
    args: TablePageGroupRestrictionArgs,
  ) =>
    resolveGroupRestriction({
      ...args,
      selectTruncations: selectGroupKeyTruncations,
    });

  const resolvePageRead = async (params: URLSearchParams) => {
    const parsed = parseTablePageParams({
      defaultLimit,
      fallbackSort: fallbackSort ?? [
        { columnKey: primaryKey, direction: 'asc' },
      ],
      ignoredSortColumns,
      params,
    });

    return parsed.kind === 'refused'
      ? parsed
      : resolveTableGroupRead({ ...parsed.params, params });
  };

  const deleteRow = async (id: TRow[TKey]) => {
    await deleteRows({
      ...target,
      filters: [{ column: primaryKey, operator: 'eq', value: id }],
    });
  };

  return {
    deleteRow,
    pageLoader: createTablePageLoader({ resolvePageRead, selectPage }),
    resolveGroupRead: resolveTableGroupRead,
    resolveGroupRestriction: resolveTableGroupRestriction,
    resolvePageRead,
    selectGroupingCapabilities,
    selectGroupKeyTruncations,
    selectPage,
    source: {
      ...createTableLoaderReads({
        limit: defaultLimit,
        reader: { selectGroupingCapabilities, selectPage },
      }),
      capabilities: TABLE_SOURCE_CAPABILITIES,
      ...(pagePath !== undefined && { pagePath }),
      schemaName: target.schema,
      tableName: target.table,
    },
  };
};

export type TablePageReader<
  TRow extends QueryResultRow = QueryResultRow,
  TKey extends keyof TRow & string = keyof TRow & string,
> = ReturnType<typeof createTablePageReader<TRow, TKey>>;
