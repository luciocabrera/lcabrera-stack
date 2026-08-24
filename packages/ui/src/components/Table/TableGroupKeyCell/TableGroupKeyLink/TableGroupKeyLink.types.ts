import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

export type TableGroupKeyLinkProps = {
  /** The applied group keys, in nesting order. */
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
  /** This key's display text — the link's label, or the bare text without one. */
  readonly text: string;
};
