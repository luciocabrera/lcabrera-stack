import { describe, expect, it } from 'vitest';

import { getStorageKey } from './getStorageKey.util';

describe('getStorageKey', () => {
  it('returns prefixed key', () => {
    expect(getStorageKey({ persistenceKey: 'myTable' })).toBe(
      'table-state-myTable',
    );
  });

  it('works with empty string', () => {
    expect(getStorageKey({ persistenceKey: '' })).toBe('table-state-');
  });

  it('scopes the key with appId when provided', () => {
    expect(
      getStorageKey({ appId: 'admin-system', persistenceKey: 'myTable' }),
    ).toBe('table-state-admin-system-myTable');
  });
});
