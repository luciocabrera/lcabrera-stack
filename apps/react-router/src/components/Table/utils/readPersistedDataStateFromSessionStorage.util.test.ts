// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { readFromSessionStorageMock } = vi.hoisted(() => ({
  readFromSessionStorageMock: vi.fn<() => string | undefined>(() => undefined),
}));

vi.mock('@/utils/storage', () => ({
  readFromSessionStorage: readFromSessionStorageMock,
}));

import { readPersistedDataStateFromSessionStorage } from './readPersistedDataStateFromSessionStorage.util';

const makeSlice = (value: unknown) =>
  JSON.stringify({ value, version: PERSISTENCE_VERSION });

describe('readPersistedDataStateFromSessionStorage', () => {
  it('returns undefined when sessionStorage has nothing', () => {
    readFromSessionStorageMock.mockReturnValue(undefined);

    expect(
      readPersistedDataStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toBeUndefined();
  });

  it('reads and returns the stored data state', () => {
    const dataState = {
      data: [{ id: 1 }, { id: 2 }],
      totalRows: 50,
    };
    readFromSessionStorageMock.mockReturnValue(makeSlice(dataState));

    expect(
      readPersistedDataStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual(dataState);
  });

  it('returns undefined on version mismatch', () => {
    readFromSessionStorageMock.mockReturnValue(
      encodeURIComponent(JSON.stringify({ value: { data: [] }, version: 99 })),
    );

    expect(
      readPersistedDataStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toBeUndefined();
  });

  it('returns undefined on invalid JSON', () => {
    readFromSessionStorageMock.mockReturnValue('invalid');

    expect(
      readPersistedDataStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toBeUndefined();
  });
});
