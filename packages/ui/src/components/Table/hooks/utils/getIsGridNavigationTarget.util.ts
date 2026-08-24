type GetIsGridNavigationTargetArgs = {
  readonly grid: EventTarget | null | undefined;
  readonly target: EventTarget | null | undefined;
};

export const getIsGridNavigationTarget = ({
  grid,
  target,
}: GetIsGridNavigationTargetArgs) => {
  if (target === grid) return true;

  return (
    target instanceof Element && target.getAttribute('role') === 'gridcell'
  );
};
