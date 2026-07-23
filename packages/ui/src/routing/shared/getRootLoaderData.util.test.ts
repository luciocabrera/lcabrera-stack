import { describe, expect, it, vi } from 'vite-plus/test';

const {
  getGlobalSettingsFromCookieMock,
  getRequestCspNonceMock,
  getThemeFromCookieMock,
} = vi.hoisted(() => ({
  getGlobalSettingsFromCookieMock: vi.fn(),
  getRequestCspNonceMock: vi.fn(),
  getThemeFromCookieMock: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/contexts/GlobalSettingsContext/GlobalSettingsContext.constants',
  () => ({
    INITIAL_GLOBAL_SETTINGS: { navigation: {}, pinning: {} },
  }),
);

vi.mock('@lcabrera/ui/utils/globalSettings', () => ({
  getGlobalSettingsFromCookie: getGlobalSettingsFromCookieMock,
}));

vi.mock('@lcabrera/ui/utils/security', () => ({
  getRequestCspNonce: getRequestCspNonceMock,
}));

vi.mock('@lcabrera/ui/utils/theme', () => ({
  getThemeFromCookie: getThemeFromCookieMock,
}));

import { getRootLoaderData } from './getRootLoaderData.util';

describe('getRootLoaderData', () => {
  it('reads the CSP nonce off the request and passes the Cookie header to the theme/global-settings readers', () => {
    getRequestCspNonceMock.mockReturnValue('nonce-abc');
    getThemeFromCookieMock.mockReturnValue('dark');
    getGlobalSettingsFromCookieMock.mockReturnValue({
      navigation: { size: 'large' },
      pinning: {},
    });

    const request = new Request('https://example.test/', {
      headers: { Cookie: 'theme=dark; other=1' },
    });

    const result = getRootLoaderData({ request });

    expect(getRequestCspNonceMock).toHaveBeenCalledWith(request);
    expect(getThemeFromCookieMock).toHaveBeenCalledWith({
      appId: undefined,
      cookieHeader: 'theme=dark; other=1',
    });
    expect(getGlobalSettingsFromCookieMock).toHaveBeenCalledWith({
      appId: undefined,
      cookieString: 'theme=dark; other=1',
      fallback: { navigation: {}, pinning: {} },
    });
    expect(result).toEqual({
      cspNonce: 'nonce-abc',
      globalSettings: { navigation: { size: 'large' }, pinning: {} },
      theme: 'dark',
    });
  });

  it('passes undefined cookieString/cookieHeader through when there is no Cookie header', () => {
    getRequestCspNonceMock.mockReturnValue(undefined);
    getThemeFromCookieMock.mockReturnValue(undefined);
    getGlobalSettingsFromCookieMock.mockReturnValue({
      navigation: {},
      pinning: {},
    });

    const request = new Request('https://example.test/');

    getRootLoaderData({ request });

    expect(getThemeFromCookieMock).toHaveBeenCalledWith({
      appId: undefined,
      cookieHeader: undefined,
    });
    expect(getGlobalSettingsFromCookieMock).toHaveBeenCalledWith({
      appId: undefined,
      cookieString: undefined,
      fallback: { navigation: {}, pinning: {} },
    });
  });

  it('scopes the cookie reads with the provided appId', () => {
    getRequestCspNonceMock.mockReturnValue(undefined);
    getThemeFromCookieMock.mockReturnValue(undefined);
    getGlobalSettingsFromCookieMock.mockReturnValue({
      navigation: {},
      pinning: {},
    });

    const request = new Request('https://example.test/', {
      headers: { Cookie: 'admin-system-theme=dark' },
    });

    getRootLoaderData({ appId: 'admin-system', request });

    expect(getThemeFromCookieMock).toHaveBeenCalledWith({
      appId: 'admin-system',
      cookieHeader: 'admin-system-theme=dark',
    });
    expect(getGlobalSettingsFromCookieMock).toHaveBeenCalledWith({
      appId: 'admin-system',
      cookieString: 'admin-system-theme=dark',
      fallback: { navigation: {}, pinning: {} },
    });
  });
});
