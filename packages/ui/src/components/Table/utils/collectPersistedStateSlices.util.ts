import type { PersistedState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { PERSISTENCE_VERSION } from './persistence.constants';

type CollectPersistedStateSlicesArgs = {
  readonly appId?: string;
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

const readSliceValue = (source: string) => {
  try {
    const parsed = JSON.parse(source) as { value: unknown; version: number };

    return parsed.version === PERSISTENCE_VERSION
      ? { value: parsed.value }
      : undefined;
  } catch {
    return;
  }
};

export const collectPersistedStateSlices = <TData = Record<string, unknown>>({
  appId,
  persistenceKey,
  readRawSlice,
  transformRaw,
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

    const parsed = readSliceValue(
      transformRaw ? transformRaw(rawValue) : rawValue,
    );

    if (!parsed) {
      continue;
    }

    result[slice] = (
      slice === 'columnVisibility' && Array.isArray(parsed.value)
        ? new Set(parsed.value as string[])
        : parsed.value
    ) as never;
  }

  return result;
};
