import { describe, expect, it } from 'vitest';

import { parseCookies } from './parseCookies.util';

describe('parseCookies', () => {
  it('parses a simple cookie', () => {
    expect(parseCookies('theme=dark')).toEqual({ theme: 'dark' });
  });

  it('parses multiple cookies', () => {
    expect(parseCookies('theme=dark; lang=en')).toEqual({
      lang: 'en',
      theme: 'dark',
    });
  });

  it('handles cookie values with = signs', () => {
    expect(parseCookies('data=foo=bar')).toEqual({ data: 'foo=bar' });
  });

  it('returns empty object for empty string', () => {
    expect(parseCookies('')).toEqual({});
  });

  it('skips cookies without a name', () => {
    const result = parseCookies('=value; theme=light');
    expect(result.theme).toBe('light');
  });
});
