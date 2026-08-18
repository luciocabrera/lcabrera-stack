import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

export type TableGroupLabelProps = {
  /** The row's place in the tree, when it has one — see `TableGroupDisclosure`. */
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly summary: TableGroupRowSummary;
};
