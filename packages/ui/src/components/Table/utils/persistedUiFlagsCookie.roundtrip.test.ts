import { describe, expect, it } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { buildUiFlagsCookieEntry } from '#ui/components/Table/contexts/TableConfig/meta/actions/utils';
import { buildSetCookieHeaders } from '#ui/routing/actions/buildSetCookieHeaders.util';

import type { PersistedUiState } from './persistence.types';

import { readPersistedUiFlagsFromCookie } from './readPersistedUiFlagsFromCookie.util';

const captureCookieHeader = (uiFlags: PersistedUiState) => {
  const entry = buildUiFlagsCookieEntry({
    currentState: {
      appId: 'react-router',
      persistenceKey: 'orders',
    } as Partial<TableMetaState>,
    nextStatePatch: uiFlags,
  });

  const headers = buildSetCookieHeaders({
    entries: entry ? [entry] : [],
    expiresAt: new Date('2100-01-01T00:00:00.000Z'),
  });

  const setCookie = headers.get('Set-Cookie') ?? '';

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

    const rawValue = cookieString.slice(cookieString.indexOf('=') + 1);

    expect(() => JSON.parse(decodeURIComponent(rawValue))).not.toThrow();
  });
});
