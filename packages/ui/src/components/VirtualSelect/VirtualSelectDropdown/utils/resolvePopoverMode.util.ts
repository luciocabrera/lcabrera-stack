type ResolvePopoverModeArgs = {
  readonly hasPopoverSupport: boolean;
  readonly isFloating: boolean;
};

export const resolvePopoverMode = ({
  hasPopoverSupport,
  isFloating,
}: ResolvePopoverModeArgs) =>
  isFloating && hasPopoverSupport ? ('manual' as const) : undefined;
