import { logger } from '@repo/ui/utils/logger';

type WriteToSessionStorageArgs = {
  readonly key: string;
  readonly value: string;
};

/**
 * Write to sessionStorage safely (SSR-safe, tab-scoped).
 * Silently ignores writes when storage is unavailable or full.
 */
export const writeToSessionStorage = ({
  key,
  value,
}: WriteToSessionStorageArgs): void => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // Storage full or access denied — fallback is intentional
    logger.debug('[storage] Failed to write sessionStorage key:', key, error);
  }
};
