import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getThemeFromCookie } from './getThemeFromCookie.util';
import { setThemeCookie } from './setThemeCookie.service';

describe('getThemeFromCookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns undefined for a missing cookieHeader', () => {
    expect(getThemeFromCookie({})).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getThemeFromCookie({ cookieHeader: '' })).toBeUndefined();
  });

  it('returns dark when cookie has theme=dark', () => {
    expect(getThemeFromCookie({ cookieHeader: 'theme=dark' })).toBe('dark');
  });

  it('returns light when cookie has theme=light', () => {
    expect(getThemeFromCookie({ cookieHeader: 'theme=light' })).toBe('light');
  });

  it('returns undefined for unknown theme value', () => {
    expect(
      getThemeFromCookie({ cookieHeader: 'theme=sunset' }),
    ).toBeUndefined();
  });

  it('returns undefined when no theme cookie present', () => {
    expect(
      getThemeFromCookie({ cookieHeader: 'lang=en; session=abc' }),
    ).toBeUndefined();
  });

  it('falls back to document.cookie when cookieHeader is not provided in browser', () => {
    vi.stubGlobal('document', { cookie: 'theme=dark; lang=en' });

    expect(getThemeFromCookie({})).toBe('dark');
  });

  it('reads the app-scoped key when appId is provided', () => {
    expect(
      getThemeFromCookie({
        appId: 'admin-system',
        cookieHeader: 'admin-system-theme=dark',
      }),
    ).toBe('dark');
  });

  it('ignores the unscoped key when an appId is provided', () => {
    expect(
      getThemeFromCookie({ appId: 'admin-system', cookieHeader: 'theme=dark' }),
    ).toBeUndefined();
  });
});

describe('setThemeCookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does nothing when fetch is unavailable', () => {
    vi.stubGlobal('fetch', undefined);

    // Should not throw
    expect(() => setThemeCookie({ theme: 'light' })).not.toThrow();
  });

  it('submits theme persistence to server action when fetch is available', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(undefined)));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', {
      pathname: '/car-sales',
      search: '?page=2',
    });

    setThemeCookie({ theme: 'dark' });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/_action/persist-cookie', {
      body: expect.any(FormData),
      method: 'POST',
    });
  });

  it('scopes the persisted cookie key with the appId', () => {
    const fetchMock = vi.fn<
      (input: string, init: { body: FormData }) => Promise<Response>
    >(() => Promise.resolve(new Response(undefined)));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { pathname: '/car-sales', search: '' });

    setThemeCookie({ appId: 'admin-system', theme: 'dark' });

    const call = fetchMock.mock.calls[0];
    const url = call?.[0];
    const formData = call?.[1]?.body;
    const entries = JSON.parse(
      (formData?.get('entries') as string) ?? '[]',
    ) as readonly { key: string }[];

    expect(url).toBe('/_action/persist-cookie');
    expect(entries[0]?.key).toBe('admin-system-theme');
  });
});
