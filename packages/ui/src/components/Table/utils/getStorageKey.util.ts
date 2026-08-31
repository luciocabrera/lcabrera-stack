type GetStorageKeyArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
};

export const getStorageKey = ({ appId, persistenceKey }: GetStorageKeyArgs) =>
  appId
    ? `table-state-${appId}-${persistenceKey}`
    : `table-state-${persistenceKey}`;
