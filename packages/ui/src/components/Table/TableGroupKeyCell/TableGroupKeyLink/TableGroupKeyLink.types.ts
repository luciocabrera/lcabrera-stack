import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupKeyLinkProps = {
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
  readonly text: string;
};
