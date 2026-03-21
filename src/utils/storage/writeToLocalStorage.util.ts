type WriteToLocalStorageArgs = {
  readonly key: string;
  readonly value: string;
};

/**
 * Write to localStorage safely
 */
export const writeToLocalStorage = ({
  key,
  value,
}: WriteToLocalStorageArgs): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or disabled
  }
};
