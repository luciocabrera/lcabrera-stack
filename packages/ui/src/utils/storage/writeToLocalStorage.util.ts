import { logger } from '@repo/ui/utils/logger';

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
  } catch (error) {
    // Storage full or disabled — fallback is intentional
    logger.debug('[storage] Failed to write localStorage key:', key, error);
  }
};
