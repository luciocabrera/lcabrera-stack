type ResolveGroupExpansionKeyArgs = {
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly isGroupRow: boolean;
  readonly key: string;
};

/**
 * Whether a key press on the focused row is a tree expansion rather than a
 * move, and which way. `undefined` hands the key back to the cell-navigation
 * map unchanged.
 *
 * This is the treegrid pattern's `ArrowRight`/`ArrowLeft`, resolved for a grid
 * whose focus is always on a **cell**: the pattern gives the two keys to
 * expansion when focus is "on a row", and this grid has no row-focus mode, so
 * the condition that stands in for it is that the focused row is a group row
 * with children.
 *
 * Each key does one job at a time, and the other job is the fallback. `Right`
 * expands a collapsed group and, once it is open, moves between cells like
 * anywhere else; `Left` collapses an open one and then moves. So no horizontal
 * navigation is lost — it is reached by pressing the key twice — and neither
 * key is ever ambiguous, because the row's own state decides which meaning is
 * live.
 *
 * A group row with nothing under it is not a tree node to open, so both keys
 * stay navigation there rather than toggling a state with no visible effect.
 * A leaf group is one of those: its rows live in their own route rather than
 * under it (#870), and `Enter` on the cell follows that link.
 */
export const resolveGroupExpansionKey = ({
  hasChildren,
  isExpanded,
  isGroupRow,
  key,
}: ResolveGroupExpansionKeyArgs) => {
  if (!isGroupRow || !hasChildren) return;

  if (key === 'ArrowRight' && !isExpanded) return 'expand' as const;

  if (key === 'ArrowLeft' && isExpanded) return 'collapse' as const;
};
