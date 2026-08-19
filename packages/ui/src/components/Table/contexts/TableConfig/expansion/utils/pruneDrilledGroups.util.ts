import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

const NO_DRILLS: TableGroupExpansionState['drilledGroups'] = new Map();

/**
 * Discards every drilled page when the rows underneath them have been re-read.
 *
 * **A drilled page is a snapshot, not a live window** (ADR-079). It is fetched
 * once, under the filters and sort the grouped view was read with — so a
 * re-read means every page in hand was fetched against a query that is no
 * longer the one on screen. Keeping them would leave rows that are individually
 * true sitting under a heading that now counts a different set, which is the
 * failure the whole drill path is built to avoid.
 *
 * It discards rather than pruning by path, and the difference matters: a group
 * that **survives** a filter change is the dangerous case, not the one that
 * disappears. Its heading still reads the same and its count has changed, so a
 * page kept under it looks correct and is not.
 *
 * That is a stricter lifetime than the collapsed set's, which is pruned rather
 * than cleared — a collapse is a view preference the user set and re-applying
 * it costs nothing, while a drilled page is data with a query attached.
 *
 * Returns the **same instance** when there is nothing to discard, so the caller
 * can skip the store write and the effect that calls it does not re-enter.
 */
export const pruneDrilledGroups = (
  drilledGroups: TableGroupExpansionState['drilledGroups'],
) => (drilledGroups.size === 0 ? drilledGroups : NO_DRILLS);
