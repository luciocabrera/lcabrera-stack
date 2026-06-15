// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { readFromSessionStorageMock } = vi.hoisted(() => ({
  readFromSessionStorageMock: vi.fn<
    (args: { key: string }) => string | undefined
  >(() => undefined),
}));

vi.mock('@/utils/storage', () => ({
  readFromSessionStorage: readFromSessionStorageMock,
}));

import { readPersistedStateFromSessionStorage } from './readPersistedStateFromSessionStorage.util';

const makeSlice = (value: unknown) =>
  encodeURIComponent(JSON.stringify({ value, version: PERSISTENCE_VERSION }));

describe('readPersistedStateFromSessionStorage', () => {
  it('returns empty object when sessionStorage has nothing', () => {
    readFromSessionStorageMock.mockReturnValue(undefined);
    expect(
      readPersistedStateFromSessionStorage({ persistenceKey: 'orders' }),
    ).toEqual({});
  });

  it('reads sorting from sessionStorage', () => {
    const sorting = [{ columnKey: 'name', direction: 'asc' }];
    readFromSessionStorageMock.mockImplementation(({ key }: { key: string }) =>
      key.endsWith('-sorting') ? makeSlice(sorting) : undefined,
    );
    const result = readPersistedStateFromSessionStorage({
      persistenceKey: 'orders',
    });
    expect(result.sorting).toEqual(sorting);
  });

  it('converts columnVisibility array to Set', () => {
    readFromSessionStorageMock.mockImplementation(({ key }: { key: string }) =>
      key.endsWith('-columnVisibility') ? makeSlice(['id', 'name']) : undefined,
    );
    const result = readPersistedStateFromSessionStorage({
      persistenceKey: 'orders',
    });
    expect(result.columnVisibility).toBeInstanceOf(Set);
    expect(result.columnVisibility).toEqual(new Set(['id', 'name']));
  });

  it('skips slices with version mismatch', () => {
    readFromSessionStorageMock.mockImplementation(({ key }: { key: string }) =>
      key.endsWith('-sorting')
        ? encodeURIComponent(JSON.stringify({ value: [], version: 99 }))
        : undefined,
    );
    const result = readPersistedStateFromSessionStorage({
      persistenceKey: 'orders',
    });
    expect(result.sorting).toBeUndefined();
  });

  it('skips slices with invalid JSON', () => {
    readFromSessionStorageMock.mockImplementation(({ key }: { key: string }) =>
      key.endsWith('-sorting') ? 'not-valid-json' : undefined,
    );
    const result = readPersistedStateFromSessionStorage({
      persistenceKey: 'orders',
    });
    expect(result.sorting).toBeUndefined();
  });
});
