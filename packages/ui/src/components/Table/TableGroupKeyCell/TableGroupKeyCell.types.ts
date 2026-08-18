import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

export type TableGroupKeyCellProps = {
  /** The group-key column this cell belongs to. */
  readonly columnKey: string;
  /** The row's place in the tree, when it has one — see `TableGroupDisclosure`. */
  readonly disclosure: TableGroupDisclosureState | undefined;
  /**
   * The applied group keys, in nesting order. Needed to place the grand total,
   * which is keyed by nothing and so belongs to no column on its own.
   */
  readonly groupingKeys: readonly string[];
  /**
   * Whether this level repeats the row above and renders blank. Never true for
   * the row's own innermost level — see `resolveCarriedGroupKeys`.
   */
  readonly isCarried: boolean;
  readonly summary: TableGroupRowSummary;
};
