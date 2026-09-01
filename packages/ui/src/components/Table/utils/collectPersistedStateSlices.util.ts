import type { PersistedState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { parseVersionedPayload } from './parseVersionedPayload.util';

type CollectPersistedStateSlicesArgs = {
  readonly appId?: string;
  readonly persistenceKey: string;
  readonly readRawSlice: (sliceKey: string) => null | string | undefined;
};

const PERSISTED_SLICES = [
  'sorting',
  'columnFilters',
  'columnOrder',
  'columnPinning',
  'columnSizing',
  'columnVisibility',
] as const;

export const collectPersistedStateSlices = <TData = Record<string, unknown>>({
  appId,
  persistenceKey,
  readRawSlice,
}: CollectPersistedStateSlicesArgs) => {
  const result: {
    -readonly [K in keyof PersistedState<TData>]?: PersistedState<TData>[K];
  } = {};
  const storageKey = getStorageKey({ appId, persistenceKey });

  for (const slice of PERSISTED_SLICES) {
    const rawValue = readRawSlice(`${storageKey}-${slice}`);

    if (!rawValue) {
      continue;
    }

    const value = parseVersionedPayload({ rawValue });

    if (value === undefined) {
      continue;
    }

    result[slice] = (
      slice === 'columnVisibility' && Array.isArray(value)
        ? new Set(value as string[])
        : value
    ) as never;
  }

  return result;
};
