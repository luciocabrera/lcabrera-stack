import type { PersistedState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type CollectPersistedStateSlicesArgs = {
  readonly persistenceKey: string;
  readonly readRawSlice: (sliceKey: string) => null | string | undefined;
  readonly transformRaw?: (raw: string) => string;
};

const PERSISTED_SLICES = [
  'sorting',
  'columnFilters',
  'columnOrder',
  'columnPinning',
  'columnSizing',
  'columnVisibility',
] as const;

/**
 * Collect persisted table state slices from a raw storage source.
 * Shared by the cookie and sessionStorage readers — each supplies how to read a
 * raw slice value (and, for cookies, how to decode it) while this helper owns
 * the slice list, version check, and `columnVisibility` array→Set conversion.
 * @param args - Persistence key, raw slice reader, and optional raw transform.
 * @returns The parsed partial persisted state.
 */
export const collectPersistedStateSlices = <TData = Record<string, unknown>>({
  persistenceKey,
  readRawSlice,
  transformRaw,
}: CollectPersistedStateSlicesArgs): Partial<PersistedState<TData>> => {
  const result: {
    -readonly [K in keyof PersistedState<TData>]?: PersistedState<TData>[K];
  } = {};
  const storageKey = getStorageKey({ persistenceKey });

  for (const slice of PERSISTED_SLICES) {
    const rawValue = readRawSlice(`${storageKey}-${slice}`);

    if (!rawValue) {
      continue;
    }

    try {
      const source = transformRaw ? transformRaw(rawValue) : rawValue;
      const parsed = JSON.parse(source) as {
        value: unknown;
        version: number;
      };
      if (parsed.version === PERSISTENCE_VERSION) {
        result[slice] = (
          slice === 'columnVisibility' && Array.isArray(parsed.value)
            ? new Set(parsed.value as string[])
            : parsed.value
        ) as never;
      }
    } catch {
      // Invalid JSON — skip
    }
  }

  return result;
};
