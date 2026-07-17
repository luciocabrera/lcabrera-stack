import { describe, expect, it } from 'vitest';

import { buildPersistCookieEntry } from './buildPersistCookieEntry.util';

describe('buildPersistCookieEntry', () => {
  it('wraps a key/value into a cookie-only entry with empty search params', () => {
    expect(buildPersistCookieEntry({ key: 'theme', value: 'dark' })).toEqual({
      key: 'theme',
      searchParamKey: '',
      searchParamValue: '',
      value: 'dark',
    });
  });

  it('preserves the exact value string (no encoding)', () => {
    const value = '{"version":1,"value":{"isTableSettingsOpen":true}}';

    expect(buildPersistCookieEntry({ key: 'k', value }).value).toBe(value);
  });
});
