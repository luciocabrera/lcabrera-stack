import { readFromLocalStorage } from '@/utils/storage';

import type { ColumnSizingState } from '../TableContext';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type GetStorageKeyArgs = {
  persistenceKey: string;
};

/**
 * @deprecated Use readPersistedStateFromCookie instead for SSR support
 *
 * Read persisted column sizing synchronously (for SSR-safe initialization)
 *
 * This function can be called during component initialization to read
 * persisted column widths without waiting for useEffect.
 */
export const getPersistedColumnSizing = ({
  persistenceKey,
}: GetStorageKeyArgs): ColumnSizingState => {
  if (typeof localStorage === 'undefined') return {};

  const sliceKey = `${getStorageKey({ persistenceKey })}-columnSizing`;
  const rawValue = readFromLocalStorage({ key: sliceKey });

  if (rawValue) {
    try {
      const parsed = JSON.parse(rawValue) as {
        value: ColumnSizingState;
        version: number;
      };
      if (parsed.version === PERSISTENCE_VERSION) {
        return parsed.value;
      }
    } catch {
      // Invalid JSON, return empty
    }
  }

  return {};
};
