import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

/**
 * The expansion store's starting state: nothing collapsed, so a grouped table paints every
 * level its read already returned (ADR-059, ADR-067).
 * There is deliberately no seed from the loader.
 */
export const getInitialExpansionState = (): TableGroupExpansionState => ({
  collapsedGroupPaths: new Set<string>(),
});
