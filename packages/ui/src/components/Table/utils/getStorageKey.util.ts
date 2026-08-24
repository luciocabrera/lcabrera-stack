type GetStorageKeyArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
};

/**
 * Get storage key with prefix.
 * When `appId` is supplied the key becomes `table-state-{appId}-{persistenceKey}` so state
 * persisted by one app never collides with another app that happens to use the same
 * `persistenceKey`.
 */
export const getStorageKey = ({ appId, persistenceKey }: GetStorageKeyArgs) =>
  appId
    ? `table-state-${appId}-${persistenceKey}`
    : `table-state-${persistenceKey}`;
