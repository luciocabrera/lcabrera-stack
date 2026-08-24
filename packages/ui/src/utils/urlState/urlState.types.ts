import type {
  TableColumnAggregate,
  TableGroupingMode,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

/**
 * Compact form of the `grouping` param:
 * `{"agg":["total_amount:sum"],"keys":["order_status"],"mode":"rollup"}`.
 * Plain JSON like `sorting` and `filters`, with no transport layer (ADR-061).
 */
export type CompactGrouping = {
  readonly agg?: readonly TableColumnAggregate[];
  /**
   * The granularity each temporal key is grouped at — a column-to-period map,
   * per-key by construction, since a column can be a group key at most once
   * (#786).
   */
  readonly gran?: Readonly<Record<string, TableGroupPeriod>>;
  readonly keys: readonly string[];
  readonly mode?: TableGroupingMode;
  readonly share?: readonly TableColumnAggregate[];
};

export type CompactSorting = Record<string, 'asc' | 'desc'>;
