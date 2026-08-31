import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

export const getInitialExpansionState = (): TableGroupExpansionState => ({
  collapsedGroupPaths: new Set<string>(),
});
