import { afterEach, describe, expect, it, vi } from 'vitest';

import { getThemeFromCookie } from './getThemeFromCookie.util';
import { setThemeCookie } from './setThemeCookie.util';

describe('getThemeFromCookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns undefined for null cookieHeader', () => {
    expect(getThemeFromCookie(null)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getThemeFromCookie('')).toBeUndefined();
  });

  it('returns dark when cookie has theme=dark', () => {
    expect(getThemeFromCookie('theme=dark')).toBe('dark');
  });

  it('returns light when cookie has theme=light', () => {
    expect(getThemeFromCookie('theme=light')).toBe('light');
  });

  it('returns undefined for unknown theme value', () => {
    expect(getThemeFromCookie('theme=sunset')).toBeUndefined();
  });

  it('returns undefined when no theme cookie present', () => {
    expect(getThemeFromCookie('lang=en; session=abc')).toBeUndefined();
  });

  it('falls back to document.cookie when cookieHeader is null in browser', () => {
    vi.stubGlobal('document', { cookie: 'theme=dark; lang=en' });

    expect(getThemeFromCookie(null)).toBe('dark');
  });
});

describe('setThemeCookie', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sets document.cookie with theme value', () => {
    let cookieValue = '';
    const docMock = { cookie: '' };
    Object.defineProperty(docMock, 'cookie', {
      set: (val: string) => {
        cookieValue = val;
      },
      get: () => cookieValue,
    });
    vi.stubGlobal('document', docMock);

    setThemeCookie('dark');
    expect(cookieValue).toContain('theme=dark');
    expect(cookieValue).toContain('SameSite=Lax');
  });

  it('does nothing when document is undefined (SSR)', () => {
    vi.stubGlobal('document', undefined);
    // Should not throw
    expect(() => setThemeCookie('light')).not.toThrow();
  });

  it('submits theme persistence to server action when fetch is available', async () => {
    let cookieValue = '';
    const docMock = { cookie: '' };
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null)));

    Object.defineProperty(docMock, 'cookie', {
      set: (val: string) => {
        cookieValue = val;
      },
      get: () => cookieValue,
    });

    vi.stubGlobal('document', docMock);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', {
      pathname: '/car-sales',
      search: '?page=2',
    });

    setThemeCookie('dark');

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/_action/persist-cookie', {
      body: expect.any(FormData),
      method: 'POST',
    });
  });
});
