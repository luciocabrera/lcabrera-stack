import { describe, expect, it } from 'vitest';

import { buildLoginRedirectUrl } from './buildLoginRedirectUrl.util';

describe('buildLoginRedirectUrl', () => {
  it('encodes the current path + search as redirectTo', () => {
    const request = new Request('http://localhost/enterprise-orders?tab=1');

    expect(buildLoginRedirectUrl({ request })).toBe(
      '/login?redirectTo=%2Fenterprise-orders%3Ftab%3D1',
    );
  });

  it('handles a bare path with no search', () => {
    const request = new Request('http://localhost/enterprise-orders');

    expect(buildLoginRedirectUrl({ request })).toBe(
      '/login?redirectTo=%2Fenterprise-orders',
    );
  });
});
