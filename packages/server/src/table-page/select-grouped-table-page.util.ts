import type {
  QueryFilter,
  QuerySort,
} from '../db/query-builder/query-builder.types.ts';
import type {
  TablePage,
  TablePageGrouping,
  TablePageTarget,
} from './table-page.types.ts';

import { readPivotMaxDistinct } from '../db/env.schema.ts';
import {
  decodeGroupedRows,
  toGroupAggregates,
  toGroupSort,
} from '../db/olap/decode-grouped-rows.util.ts';
import { selectGroupedRows } from '../db/select-grouped-rows.util.ts';
import { toSerializableDbError } from '../errors/to-serializable-db-error.util.ts';

type SelectGroupedTablePageArgs = {
  readonly filters: readonly QueryFilter[];
  readonly grouping: TablePageGrouping;
  readonly maxRows: number;
  readonly sort: readonly QuerySort[];
  readonly subtotalPlacement: 'first' | 'last';
  readonly target: TablePageTarget;
};

export const selectGroupedTablePage = async ({
  filters,
  grouping,
  maxRows,
  sort,
  subtotalPlacement,
  target,
}: SelectGroupedTablePageArgs): Promise<TablePage<never>> => {
  const { columnAxis, keys } = grouping;
  const requested = grouping.aggregates.map(({ columnKey, fn }) => ({
    column: columnKey,
    fn,
  }));

  try {
    const built = await selectGroupedRows({
      ...target,
      aggregates: toGroupAggregates({ requested }),
      filters,
      grouping: grouping.mode,
      keys,
      maxRows,
      periods: grouping.periods,
      sort: toGroupSort({ groupKeys: keys, requested, sort }),
      subtotalPlacement,
      ...(columnAxis !== undefined && {
        columnAxis: {
          key: columnAxis,
          maxDistinct: readPivotMaxDistinct({ env: process.env }),
        },
      }),
    });
    const data = decodeGroupedRows({
      aggregates: built.aggregates,
      columnKeys: keys,
      maskAlias: built.maskAlias,
      requested,
      rows: built.rows,
      truncations: built.truncations,
      ...(built.columnAxis !== undefined && { columnAxis: built.columnAxis }),
    });

    return {
      data,
      hasMore: false,
      total: data.length,
      ...(built.warning !== undefined && { groupingWarning: built.warning }),
    };
  } catch (error) {
    return {
      data: [],
      error: toSerializableDbError(error),
      hasMore: false,
      total: 0,
    };
  }
};
