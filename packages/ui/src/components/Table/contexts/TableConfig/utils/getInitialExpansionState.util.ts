import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

/**
 * The expansion store's starting state: nothing collapsed, so a grouped table
 * paints every level its read already returned (ADR-059, ADR-067).
 *
 * There is deliberately no seed from the loader. Expansion does not travel in
 * the URL and is not restored on reload — a shared link carries the analysis,
 * not the reading position (ADR-061) — so a cold load has nothing to seed from
 * and inventing a default depth here would make the recipient's grid differ
 * from the sender's for no stated reason.
 *
 * A fresh `Set` per call, never a shared constant: two tables mounted at once
 * would otherwise collapse each other's groups.
 */
export const getInitialExpansionState = (): TableGroupExpansionState => ({
  collapsedGroupPaths: new Set<string>(),
});
