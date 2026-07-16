// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { PERSISTENCE_VERSION } from './persistence.constants';

const { writeToSessionStorageMock } = vi.hoisted(() => ({
  writeToSessionStorageMock: vi.fn(),
}));

vi.mock('@repo/ui/utils/storage', () => ({
  writeToSessionStorage: writeToSessionStorageMock,
}));

import { writePersistedDataStateToSessionStorage } from './writePersistedDataStateToSessionStorage.service';

describe('writePersistedDataStateToSessionStorage', () => {
  it('writes the serialized data state to sessionStorage with version', () => {
    const dataState = {
      data: [{ id: 1 }],
      totalRows: 100,
    };

    writePersistedDataStateToSessionStorage({
      dataState,
      persistenceKey: 'orders',
    });

    expect(writeToSessionStorageMock).toHaveBeenCalledTimes(1);
    const call = writeToSessionStorageMock.mock.calls[0];
    const args = call?.[0] as undefined | { key: string; value: string };
    expect(args?.key).toBe('table-state-orders-dataState');

    const decoded = JSON.parse(decodeURIComponent(args?.value ?? '')) as {
      value: unknown;
      version: number;
    };
    expect(decoded.version).toBe(PERSISTENCE_VERSION);
    expect(decoded.value).toEqual(dataState);
  });
});
