import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';

import type {
  DbRow,
  PaginatedResponse,
  SortRule,
} from '../../types/api.types.js';

import { resolveSortRules } from '../../utils/resolveSortRules.util.js';
import { serializeDatabaseValue } from '../../utils/serializeDatabaseValue.util.js';
import {
  DEFAULT_WIDE_ALLTYPES_SORTING,
  MAX_WIDE_ALLTYPES_SORT_RULES,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_PRIMARY_KEY,
  WIDE_ALLTYPES_SCHEMA,
  WIDE_ALLTYPES_SORTABLE_COLUMNS,
  WIDE_ALLTYPES_TABLE,
} from './wideAlltypes150.constants.js';

export type WideAlltypes150Repository = {
  readonly getPaginated: (
    args: GetPaginatedWideAlltypes150Args,
  ) => Promise<PaginatedResponse<DbRow>>;
};

type GetPaginatedWideAlltypes150Args = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

const TARGET = {
  schema: WIDE_ALLTYPES_SCHEMA,
  table: WIDE_ALLTYPES_TABLE,
} as const;

/**
 * Database access for wide-alltypes endpoints, composed from the generic
 * `@lcabrera/server` executors. `c_018` is a valid column to *select* but not to
 * *sort* by, so request sort rules are pre-filtered to the sortable set before
 * they reach `selectRows` — which validates every sort column and would
 * otherwise reject the whole read.
 */
export const createWideAlltypes150Repository =
  (): WideAlltypes150Repository => ({
    getPaginated: async ({ limit, skip, sorting }) => {
      const safeSorting = sorting
        .filter(({ columnKey }) =>
          WIDE_ALLTYPES_SORTABLE_COLUMNS.has(columnKey),
        )
        .slice(0, MAX_WIDE_ALLTYPES_SORT_RULES);

      const rows = await selectRows<DbRow>({
        ...TARGET,
        allowedColumns: WIDE_ALLTYPES_COLUMNS,
        fields: WIDE_ALLTYPES_COLUMNS,
        limit,
        offset: skip,
        sort: resolveSortRules({
          fallbackSorting: DEFAULT_WIDE_ALLTYPES_SORTING,
          sorting: safeSorting,
        }),
      });
      const data = rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            serializeDatabaseValue(value),
          ]),
        ),
      );
      const total = await getRowsCount({
        ...TARGET,
        column: WIDE_ALLTYPES_PRIMARY_KEY,
      });

      return {
        data,
        hasMore: skip + data.length < total,
        total,
      };
    },
  });
