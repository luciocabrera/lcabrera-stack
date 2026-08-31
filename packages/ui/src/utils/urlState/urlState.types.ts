import type {
  TableColumnAggregate,
  TableGroupingMode,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

export type CompactGrouping = {
  readonly agg?: readonly TableColumnAggregate[];
  /** Column-to-period map; a column can be a group key at most once. */
  readonly gran?: Readonly<Record<string, TableGroupPeriod>>;
  readonly keys: readonly string[];
  readonly mode?: TableGroupingMode;
  readonly share?: readonly TableColumnAggregate[];
};

export type CompactSorting = Record<string, 'asc' | 'desc'>;
