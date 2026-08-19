import type { TableGroupDrill } from '#ui/components/Table/Table.types';

type ResolveGroupRowIsExpandedArgs = {
  readonly drill: TableGroupDrill | undefined;
  readonly isCollapsed: boolean;
  readonly isDrillable: boolean;
  readonly pathKey: string | undefined;
};

/**
 * Whether one group row is showing what is under it — which two kinds of row
 * answer differently.
 *
 * An ordinary group row is expanded unless it is in the collapsed set, because
 * expansion is held by its complement (ADR-067).
 *
 * **A drillable leaf needs the drill entry as well**, and the collapsed set says
 * nothing on its own: an untouched group is not in it, so reading expansion from
 * membership alone would report every leaf open with nothing under it. What it
 * has to say is "something has been asked for and is not folded away" (ADR-079).
 */
export const resolveGroupRowIsExpanded = ({
  drill,
  isCollapsed,
  isDrillable,
  pathKey,
}: ResolveGroupRowIsExpandedArgs) => {
  if (isCollapsed) return false;

  // One presence test over whichever value answers for this kind of row: a
  // drilled page for a leaf, a path key for an ordinary group row.
  return (isDrillable ? drill : pathKey) !== undefined;
};
