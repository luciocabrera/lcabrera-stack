import type { TableGroupLevelDisclosure } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveGroupLevelDisclosures.util';
import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

export type TableGroupDisclosureProps = {
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly path: readonly TableGroupKeyValue[];
};

/**
 * `hasChildren` cannot be read from a summary alone: it is a question about the *other*
 * rows, and rollup answers it counter-intuitively — a subtotal sits **below** the rows it
 * totals, so an adjacency test reports it as childless and leaves the one row a user most
 * wants to fold unfoldable.
 */
export type TableGroupDisclosureState = {
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly levelDisclosures: readonly TableGroupLevelDisclosure[];
};
