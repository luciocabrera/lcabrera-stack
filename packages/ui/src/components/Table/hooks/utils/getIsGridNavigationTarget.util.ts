type GetIsGridNavigationTargetArgs = {
  readonly grid: EventTarget | null | undefined;
  readonly target: EventTarget | null | undefined;
};

/**
 * Whether a key event inside the grid is the grid's own to interpret.
 *
 * Only the grid container and a cell navigate. A control rendered *inside* a
 * cell — a row-actions menu, a filter input — owns its own arrow keys, and a
 * grid that swallowed them from the bubbling phase would break every widget it
 * contains while looking like it worked.
 */
export const getIsGridNavigationTarget = ({
  grid,
  target,
}: GetIsGridNavigationTargetArgs) => {
  if (target === grid) return true;

  return (
    target instanceof Element && target.getAttribute('role') === 'gridcell'
  );
};
