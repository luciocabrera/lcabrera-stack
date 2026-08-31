import { describe, expect, it } from 'vite-plus/test';

import { getDemoCredential } from './getDemoCredential.util';

describe('getDemoCredential', () => {
  it('returns the default demo credential in development', () => {
    const credential = getDemoCredential({
      env: { NODE_ENV: 'development' },
    });

    expect(credential.email).toBe('demo@example.com');
    expect(credential.secretHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('reflects environment overrides', () => {
    const credential = getDemoCredential({
      env: {
        AUTH_DEMO_EMAIL: 'ops@corp.test',
        AUTH_DEMO_PASSWORD_HASH: 'aa:bb',
        NODE_ENV: 'development',
      },
    });

    expect(credential).toEqual({
      email: 'ops@corp.test',
      secretHash: 'aa:bb',
    });
  });
});
