import type { TableGroupDrill } from '#ui/components/Table/Table.types';

type ResolveGroupToggleActionArgs = {
  /** This group's drill entry, `undefined` when nobody has asked for one. */
  readonly drill: TableGroupDrill | undefined;
  /** Whether the group is collapsed **now**, before the gesture is applied. */
  readonly isCollapsed: boolean;
  readonly isDrillable: boolean;
};

/**
 * What one gesture on a group row means: fetch its rows, or fold them.
 *
 * **A drillable leaf cannot use the plain toggle, and the reason is ADR-067.**
 * Expansion is held by its complement, so a group nobody has touched is
 * *expanded* — and the first gesture on one would therefore **collapse** it,
 * hiding nothing, which is the opposite of what a reader clicking a leaf wants.
 * The absence of a drill entry is what distinguishes "nobody has asked" from
 * "asked and folded away", and it is the only thing that can.
 *
 * `drill` re-expands as well as fetching, because the retry case reaches it
 * from a collapsed group: a failed drill is left standing, folded away, and
 * reopening it is the one deliberate gesture that leaves the state (ADR-079,
 * amended). Nothing retries on the user's behalf — that would turn a bounded
 * read into an unbounded one.
 *
 * A `loading` or `loaded` entry falls through to `toggle`, so folding a drilled
 * group away and back costs no second request. `loaded` is terminal, and a
 * collapse must not quietly un-terminate it.
 */
export const resolveGroupToggleAction = ({
  drill,
  isCollapsed,
  isDrillable,
}: ResolveGroupToggleActionArgs) => {
  if (!isDrillable) return 'toggle' as const;

  if (drill === undefined) return 'drill' as const;

  return isCollapsed && drill.status === 'failed'
    ? ('drill' as const)
    : ('toggle' as const);
};
