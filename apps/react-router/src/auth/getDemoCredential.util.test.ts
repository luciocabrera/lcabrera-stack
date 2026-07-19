import { describe, expect, it } from 'vitest';

import { getDemoCredential } from './getDemoCredential.util';

describe('getDemoCredential', () => {
  it('returns the default demo credential when nothing is configured', () => {
    const credential = getDemoCredential({ env: {} });

    expect(credential.email).toBe('demo@example.com');
    expect(credential.secretHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('reflects environment overrides', () => {
    const credential = getDemoCredential({
      env: {
        AUTH_DEMO_EMAIL: 'ops@corp.test',
        AUTH_DEMO_PASSWORD_HASH: 'aa:bb',
      },
    });

    expect(credential).toEqual({
      email: 'ops@corp.test',
      secretHash: 'aa:bb',
    });
  });
});
