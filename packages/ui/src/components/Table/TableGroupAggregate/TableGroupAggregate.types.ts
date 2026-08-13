import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupAggregateProps = {
  /** The column this cell belongs to — which aggregate, if any, it shows. */
  readonly columnKey: string;
  readonly summary: TableGroupRowSummary;
};
