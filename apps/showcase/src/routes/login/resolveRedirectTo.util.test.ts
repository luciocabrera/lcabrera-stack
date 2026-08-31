import { describe, expect, it } from 'vite-plus/test';

import { resolveRedirectTo } from './resolveRedirectTo.util';

describe('resolveRedirectTo', () => {
  it('honors a same-origin absolute path', () => {
    expect(resolveRedirectTo({ candidate: '/enterprise-orders?tab=1' })).toBe(
      '/enterprise-orders?tab=1',
    );
  });

  it('falls back to default for a missing (non-string) candidate', () => {
    const absent = new URLSearchParams().get('redirectTo');

    expect(resolveRedirectTo({ candidate: absent })).toBe('/');
  });

  it('rejects a protocol-relative URL', () => {
    expect(resolveRedirectTo({ candidate: '//evil.example' })).toBe('/');
  });

  it('rejects a fully-qualified URL', () => {
    expect(resolveRedirectTo({ candidate: 'https://evil.example' })).toBe('/');
  });

  it('rejects a bare relative path', () => {
    expect(resolveRedirectTo({ candidate: 'enterprise-orders' })).toBe('/');
  });
});
