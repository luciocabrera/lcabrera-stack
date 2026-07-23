import { describe, expect, it } from 'vite-plus/test';

import { buildCookieString } from './buildCookieString.util';

const expiresAt = new Date('2027-07-12T10:00:00.000Z');

describe('buildCookieString', () => {
  it('builds a cookie string with the key and encoded value', () => {
    const result = buildCookieString({
      expiresAt,
      key: 'theme',
      value: 'dark',
    });
    expect(result).toContain('theme=dark');
    expect(result).toContain('path=/');
    expect(result).toContain('SameSite=Lax');
  });

  it('URL-encodes special characters in value', () => {
    const result = buildCookieString({
      expiresAt,
      key: 'data',
      value: 'hello world',
    });
    expect(result).toContain('data=hello%20world');
  });

  it('uses the injected expiry date verbatim', () => {
    const result = buildCookieString({ expiresAt, key: 'k', value: 'v' });
    expect(result).toContain(`expires=${expiresAt.toUTCString()}`);
  });

  it('is deterministic for identical input', () => {
    const args = { expiresAt, key: 'k', value: 'v' };
    expect(buildCookieString(args)).toBe(buildCookieString(args));
  });

  it('handles empty value', () => {
    const result = buildCookieString({ expiresAt, key: 'k', value: '' });
    expect(result).toContain('k=');
  });
});
