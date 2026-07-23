import { describe, expect, it } from 'vite-plus/test';

import { getAppScopedCookieKey } from './getAppScopedCookieKey.util';

describe('getAppScopedCookieKey', () => {
  it('returns the bare key when no appId is provided', () => {
    expect(getAppScopedCookieKey({ key: 'theme' })).toBe('theme');
  });

  it('prefixes the key with the appId when provided', () => {
    expect(getAppScopedCookieKey({ appId: 'admin-system', key: 'theme' })).toBe(
      'admin-system-theme',
    );
  });

  it('treats an empty appId as no scoping', () => {
    expect(getAppScopedCookieKey({ appId: '', key: 'global-settings' })).toBe(
      'global-settings',
    );
  });
});
