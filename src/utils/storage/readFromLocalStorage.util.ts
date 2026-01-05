type ReadFromLocalStorageArgs = {
  key: string;
};

/**
 * Read from localStorage safely
 */
export const readFromLocalStorage = ({
  key,
}: ReadFromLocalStorageArgs): string | undefined => {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};
