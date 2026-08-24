import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupAggregateProps = {
  readonly columnKey: string;
  readonly summary: TableGroupRowSummary;
};
