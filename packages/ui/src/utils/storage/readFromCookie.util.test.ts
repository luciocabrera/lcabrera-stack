import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { readFromCookie } from './readFromCookie.util';

describe('readFromCookie', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reads from document.cookie when no cookieString provided', () => {
    vi.stubGlobal('document', { cookie: 'theme=dark; lang=en' });
    expect(readFromCookie({ key: 'theme' })).toBe('dark');
  });

  it('returns undefined when key not in document.cookie', () => {
    vi.stubGlobal('document', { cookie: 'lang=en' });
    expect(readFromCookie({ key: 'theme' })).toBeUndefined();
  });

  it('reads from provided cookieString instead of document', () => {
    vi.stubGlobal('document', { cookie: 'theme=dark' });
    expect(readFromCookie({ cookieString: 'theme=light', key: 'theme' })).toBe(
      'light',
    );
  });

  it('returns undefined when document is undefined and no cookieString', () => {
    vi.stubGlobal('document', undefined);
    expect(readFromCookie({ key: 'theme' })).toBeUndefined();
  });

  it('parses cookieString even without document', () => {
    vi.stubGlobal('document', undefined);
    expect(
      readFromCookie({ cookieString: 'theme=dark; lang=en', key: 'lang' }),
    ).toBe('en');
  });
});
