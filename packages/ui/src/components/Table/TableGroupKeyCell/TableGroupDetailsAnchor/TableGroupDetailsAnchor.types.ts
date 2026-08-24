import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupDetailsAnchorProps = {
  readonly groupDetailsPath: string;
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
  readonly text: string;
};
