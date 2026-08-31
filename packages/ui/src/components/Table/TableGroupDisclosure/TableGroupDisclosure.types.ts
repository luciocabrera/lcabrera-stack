import type { TableGroupLevelDisclosure } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveGroupLevelDisclosures.util';
import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

export type TableGroupDisclosureProps = {
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly path: readonly TableGroupKeyValue[];
};

export type TableGroupDisclosureState = {
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly levelDisclosures: readonly TableGroupLevelDisclosure[];
};
