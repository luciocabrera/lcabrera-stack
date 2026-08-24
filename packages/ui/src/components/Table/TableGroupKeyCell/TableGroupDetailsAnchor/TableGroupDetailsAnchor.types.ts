import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupDetailsAnchorProps = {
  /** Where the route serves one group's rows — resolved by the caller. */
  readonly groupDetailsPath: string;
  /** The applied group keys, in nesting order. */
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
  /** This key's display text — the link's label. */
  readonly text: string;
};
