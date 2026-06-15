type ReadFromSessionStorageArgs = {
  readonly key: string;
};

/**
 * Read from sessionStorage safely (SSR-safe, tab-scoped).
 * Returns undefined on SSR or if the key does not exist.
 */
export const readFromSessionStorage = ({
  key,
}: ReadFromSessionStorageArgs): string | undefined => {
  if (typeof sessionStorage === 'undefined') return undefined;
  try {
    return sessionStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};
