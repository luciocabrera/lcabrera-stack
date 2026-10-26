type NeedsOwnTableStackArgs = {
  readonly hasConfig: boolean;
  readonly hasRows: boolean;
  readonly isInOwnStack: boolean;
};

export const needsOwnTableStack = ({
  hasConfig,
  hasRows,
  isInOwnStack,
}: NeedsOwnTableStackArgs) => !hasConfig || (hasRows && !isInOwnStack);
