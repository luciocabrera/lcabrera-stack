import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

export type TableGroupKeyCellProps = {
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly groupingKeys: readonly string[];
  /** Never true for the row's own innermost level. */
  readonly isCarried: boolean;
  readonly summary: TableGroupRowSummary;
};
