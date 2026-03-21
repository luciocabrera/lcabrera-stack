type GetStorageKeyArgs = {
  readonly persistenceKey: string;
};

/**
 * Get storage key with prefix
 */
export const getStorageKey = ({ persistenceKey }: GetStorageKeyArgs): string =>
  `table-state-${persistenceKey}`;
