import { describe, expect, it } from 'vite-plus/test';

import { resolveRedirectTo } from './resolveRedirectTo.util';

const DEFAULT_REDIRECT = '/cqms/projects';

describe('resolveRedirectTo', () => {
  it('honors a same-origin absolute path', () => {
    expect(
      resolveRedirectTo({
        url: 'https://cqms.example/login?redirectTo=/cqms/scanners/view/linter',
      }),
    ).toBe('/cqms/scanners/view/linter');
  });

  it('falls back to the default when no redirectTo is given', () => {
    expect(resolveRedirectTo({ url: 'https://cqms.example/login' })).toBe(
      DEFAULT_REDIRECT,
    );
  });

  it('keeps the query string and fragment of an internal path', () => {
    expect(
      resolveRedirectTo({
        url: 'https://cqms.example/login?redirectTo=%2Fcqms%2Fruns%3Ftab%3Dfailed',
      }),
    ).toBe('/cqms/runs?tab=failed');
  });

  // Each of these is an open redirect if honored: the link lives on our origin
  // and lands the user somewhere else after a real login.
  it.each([
    { label: 'protocol-relative', redirectTo: '//evil.example' },
    {
      label: 'protocol-relative with a path',
      redirectTo: '//evil.example/phish',
    },
    { label: 'fully qualified https', redirectTo: 'https://evil.example' },
    { label: 'fully qualified http', redirectTo: 'http://evil.example/login' },
    { label: 'scheme-only', redirectTo: 'javascript:alert(1)' },
    { label: 'a relative path', redirectTo: 'cqms/projects' },
    { label: 'empty', redirectTo: '' },
  ])('refuses $label and uses the default instead', ({ redirectTo }) => {
    const url = `https://cqms.example/login?redirectTo=${encodeURIComponent(redirectTo)}`;

    expect(resolveRedirectTo({ url })).toBe(DEFAULT_REDIRECT);
  });
});
