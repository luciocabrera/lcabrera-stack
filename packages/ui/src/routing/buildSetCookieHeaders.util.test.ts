import { describe, expect, it } from 'vitest';

import { buildSetCookieHeaders } from './buildSetCookieHeaders.util';

const expiresAt = new Date('2027-07-12T10:00:00.000Z');

describe('buildSetCookieHeaders', () => {
  it('returns a Headers instance', () => {
    expect(buildSetCookieHeaders({ entries: [], expiresAt })).toBeInstanceOf(
      Headers,
    );
  });

  it('appends one Set-Cookie per entry with both key and value', () => {
    const headers = buildSetCookieHeaders({
      entries: [
        { key: 'theme', value: 'dark' },
        { key: 'lang', value: 'en' },
      ],
      expiresAt,
    });

    const setCookie = headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('theme=dark');
    expect(setCookie).toContain('lang=en');
  });

  it('passes the injected expiry through to each cookie', () => {
    const headers = buildSetCookieHeaders({
      entries: [{ key: 'theme', value: 'dark' }],
      expiresAt,
    });

    expect(headers.get('set-cookie')).toContain(
      `expires=${expiresAt.toUTCString()}`,
    );
  });

  it('skips entries missing a key or a value', () => {
    const headers = buildSetCookieHeaders({
      entries: [
        { key: '', value: 'orphan-value' },
        { key: 'orphan-key', value: '' },
        { key: 'kept', value: 'yes' },
      ],
      expiresAt,
    });

    const setCookie = headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('kept=yes');
    expect(setCookie).not.toContain('orphan-value');
    expect(setCookie).not.toContain('orphan-key');
  });

  it('returns empty Set-Cookie when no entry qualifies', () => {
    const headers = buildSetCookieHeaders({
      entries: [{ key: '', value: '' }],
      expiresAt,
    });

    expect(headers.get('set-cookie')).toBeNull();
  });
});
