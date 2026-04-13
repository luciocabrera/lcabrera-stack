import { afterEach, describe, expect, it, vi } from 'vitest';

import { getThemeFromCookie, setThemeCookie } from './theme-cookie.util.ts';

describe('getThemeFromCookie', () => {
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
});

describe('setThemeCookie', () => {
  afterEach(() => {
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

    vi.unstubAllGlobals();
  });

  it('does nothing when document is undefined (SSR)', () => {
    vi.stubGlobal('document', undefined);
    // Should not throw
    expect(() => setThemeCookie('light')).not.toThrow();
    vi.unstubAllGlobals();
  });
});
