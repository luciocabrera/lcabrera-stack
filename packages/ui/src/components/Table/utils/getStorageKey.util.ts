type GetStorageKeyArgs = {
  /**
   * Per-application identifier. When provided, it scopes the key so that
   * different apps reusing the same `persistenceKey` do not share cookies /
   * storage entries. Omit for app-agnostic (legacy) keys.
   */
  readonly appId?: string;
  readonly persistenceKey: string;
};

/**
 * Get storage key with prefix.
 *
 * When `appId` is supplied the key becomes `table-state-{appId}-{persistenceKey}`
 * so state persisted by one app never collides with another app that happens to
 * use the same `persistenceKey`.
 */
export const getStorageKey = ({
  appId,
  persistenceKey,
}: GetStorageKeyArgs): string =>
  appId
    ? `table-state-${appId}-${persistenceKey}`
    : `table-state-${persistenceKey}`;
