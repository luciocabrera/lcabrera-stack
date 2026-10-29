type NeedsOwnTableStackArgs = {
  readonly hasConfig: boolean;
  readonly isInOwnStack: boolean;
  readonly isRowsResponse: boolean;
};

export const needsOwnTableStack = ({
  hasConfig,
  isInOwnStack,
  isRowsResponse,
}: NeedsOwnTableStackArgs) => !hasConfig || (isRowsResponse && !isInOwnStack);
