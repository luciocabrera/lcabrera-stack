import { describe, expect, it } from 'vitest';

import type { PersistedUiState } from './persistence.types';

import { readPersistedUiFlagsFromCookie } from './readPersistedUiFlagsFromCookie.util';
import { writePersistedUiFlagsToCookie } from './writePersistedUiFlagsToCookie.service';

/**
 * The writer and the reader each mock the storage layer in their own unit test,
 * so neither can see the encoding the other end applies. That seam is exactly
 * where the drawer flags broke: the writer URI-encoded a payload `writeToCookie`
 * then encoded again, and the reader's single decode left it unparseable — so
 * the loader silently SSR'd the drawer closed and it popped open at hydration.
 *
 * This exercises the real pair over a real Set-Cookie header. No mocks.
 */
const captureCookieHeader = (uiFlags: PersistedUiState) => {
  const headers = new Headers();

  writePersistedUiFlagsToCookie({
    appId: 'react-router',
    headers,
    persistenceKey: 'orders',
    uiFlags,
  });

  const setCookie = headers.get('Set-Cookie') ?? '';

  // A Set-Cookie header is `key=value; attr; attr` — a request Cookie header is
  // just the `key=value` pair, which is what the loader receives.
  return setCookie.split(';', 1)[0] ?? '';
};

describe('persisted UI flags cookie round trip', () => {
  it('reads back exactly what it wrote', () => {
    const uiFlags = {
      isColumnSettingsOpen: false,
      isColumnSettingsPinned: false,
      isTableSettingsOpen: true,
      isTableSettingsPinned: true,
    };

    const cookieString = captureCookieHeader(uiFlags);

    expect(
      readPersistedUiFlagsFromCookie({
        appId: 'react-router',
        cookieString,
        persistenceKey: 'orders',
      }),
    ).toEqual(uiFlags);
  });

  it('survives a value that percent-encodes, rather than double-encoding it', () => {
    const cookieString = captureCookieHeader({ isTableSettingsOpen: true });

    // One level of encoding only: decoding once must yield parseable JSON.
    const rawValue = cookieString.slice(cookieString.indexOf('=') + 1);

    expect(() => JSON.parse(decodeURIComponent(rawValue))).not.toThrow();
  });
});
