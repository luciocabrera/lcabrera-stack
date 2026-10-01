import type {
  AggregateFn,
  GroupCardinalityWarning,
  GroupingMode,
  GroupKeyPeriod,
} from '../db/group-query-builder/group-query-builder.types.ts';
import type { toGroupRow } from '../db/olap/to-group-row.util.ts';
import type {
  QueryFilter,
  QuerySort,
} from '../db/query-builder/query-builder.types.ts';
import type { SerializableDbError } from '../errors/errors.types.ts';
import type { ColumnSort } from '../sort/sort.types.ts';

export type TablePage<TRow> = {
  readonly data: readonly (TablePageGroupRow | TRow)[];
  readonly error?: SerializableDbError;
  readonly groupingWarning?: GroupCardinalityWarning;
  readonly hasMore: boolean;
  readonly total?: number;
};

export type TablePageAggregate = {
  readonly columnKey: string;
  readonly fn: AggregateFn;
};

export type TablePageGrouping = {
  readonly aggregates: readonly TablePageAggregate[];
  /** Distinct values of this column become measure columns. */
  readonly columnAxis?: string;
  readonly keys: readonly string[];
  readonly mode: GroupingMode;
  readonly periods: Readonly<Record<string, GroupKeyPeriod>>;
};

export type TablePageGroupRow = ReturnType<typeof toGroupRow>;

export type TablePageParams = {
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly QuerySort[];
};

export type TablePageRead = {
  /** One value per `sort` entry, from the last row of the previous page. */
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  /** A read with no group keys returns rows, not groups. */
  readonly grouping?: TablePageGrouping;
  readonly includeTotal: boolean;
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
  /** Defaults to `'last'`. */
  readonly totalsPlacement?: 'first' | 'last';
};

export type TablePageSortRule = {
  readonly columnKey: string;
  /** A rule with no direction sorts nothing and is dropped. */
  readonly direction?: ColumnSort['direction'];
};

export type TablePageTarget = {
  /** Every request-derived column is checked against this list. */
  readonly allowedColumns: readonly string[];
  readonly schema: string;
  readonly table: string;
};
